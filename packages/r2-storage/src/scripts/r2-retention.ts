/**
 * R2 保持ポリシーの実行 (legacy prefix の棚卸しと削除)。
 *
 * 正典: `.claude/rules/r2-storage-design.md`「R2 保持・削除ポリシー」
 *
 * 安全設計:
 * - 削除できるのは下記 RETENTION_TARGETS に**コードとして書かれた prefix だけ**。
 *   任意 prefix を受け取る CLI 引数は持たない (`delete-r2-prefix.ts` との違い)。
 * - PROTECTED_PREFIXES と重なる target があれば起動時に throw する (typo で配信データを消せない)。
 * - 既定は dry-run。`--apply` を付けたときだけ削除する。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/r2-retention.ts
 *   npx tsx packages/r2-storage/src/scripts/r2-retention.ts --target legacy-bare-ranking
 *   npx tsx packages/r2-storage/src/scripts/r2-retention.ts --apply
 */
import { config } from "dotenv";
import path from "path";

import { deleteMultipleFromR2, listFromR2WithSize } from "../lib";
import { formatBytes } from "../lib/utils/format-bytes";
import { assertR2WriteAllowed } from "./_assert-ci-write";

config({ path: path.resolve(__dirname, "../../../..", ".env.local") });

interface RetentionTarget {
  /** --target で指定する識別子 */
  id: string;
  /** 削除対象の prefix (必ず "/" 終端) */
  prefix: string;
  /** なぜ削除してよいか (reader ゼロの根拠) */
  reason: string;
}

/**
 * 削除してよい prefix の allowlist。
 *
 * 追加するときは「アプリの reader がゼロであること」を grep で裏取りし、
 * `.claude/rules/r2-storage-design.md` の保持ポリシー節にも記録すること。
 */
const RETENTION_TARGETS: RetentionTarget[] = [
  {
    id: "legacy-bare-ranking-items",
    prefix: "ranking-items/",
    reason: "app/ranking-items/all.json へ移行済み (reader は app/ 版のみ参照)",
  },
  {
    id: "legacy-bare-surveys",
    prefix: "surveys/",
    reason: "app/survey/all.json へ移行済み",
  },
  {
    id: "legacy-bare-area-profile",
    prefix: "area-profile/",
    reason: "app/areas/<code>/profile.json へ移行済み",
  },
  {
    id: "legacy-bare-ranking",
    prefix: "ranking/",
    reason:
      "app/ranking/<key>/* へ移行済み。廃止済み旧サムネイル ranking/prefecture/<key>/<year>/ を含む",
  },
  {
    id: "legacy-bare-correlation",
    prefix: "correlation/",
    reason: "app/correlation/by-ranking-key/<key>.json へ移行済み",
  },
  {
    id: "legacy-bare-blog",
    prefix: "blog/",
    reason: "app/blog/<slug>/* へ移行済み",
  },
  {
    id: "retired-fishing-ports",
    prefix: "app/fishing-ports/",
    reason:
      "ルート廃止 (2026-05-28)。reader/exporter とも commit 22092e9 (2026-06-13) で削除済み",
  },
  {
    id: "retired-ports",
    prefix: "app/ports/",
    reason: "同上 (/themes/ports は app/ranking/<key> のみ読む)",
  },
  {
    id: "retired-port-statistics",
    prefix: "app/port-statistics/",
    reason: "同上",
  },
];

/**
 * 絶対に削除しない prefix。RETENTION_TARGETS がこれらと重なれば起動時に落とす。
 * (配信データ・再生成コストの高い派生物・正典が保持を明示しているもの)
 */
const PROTECTED_PREFIXES = [
  "app/ranking/",
  "app/ranking-items/",
  "app/blog/",
  "app/areas/",
  "app/survey/",
  "app/category/",
  "app/stats/",
  "app/correlation/",
  "app/home/",
  "app/page-components/",
  "app/affiliate-ads/",
  "app/gis-cross/",
  "staging/image-cache/",
  "incremental-cache/",
  "sns/",
  "note/",
  "video/",
  "ges/",
  "gis/",
];

function assertTargetsAreSafe(): void {
  for (const target of RETENTION_TARGETS) {
    if (!target.prefix.endsWith("/")) {
      throw new Error(`[unsafe target] prefix must end with "/": ${target.prefix}`);
    }
    for (const protectedPrefix of PROTECTED_PREFIXES) {
      if (
        target.prefix.startsWith(protectedPrefix) ||
        protectedPrefix.startsWith(target.prefix)
      ) {
        throw new Error(
          `[unsafe target] "${target.prefix}" overlaps protected prefix "${protectedPrefix}"`,
        );
      }
    }
  }

  const ids = RETENTION_TARGETS.map((t) => t.id);
  const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicated.length > 0) {
    throw new Error(`[unsafe target] duplicated id: ${duplicated.join(", ")}`);
  }
}

function parseArgs(): { apply: boolean; targetId?: string } {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf("--target");
  const targetId = targetIdx >= 0 ? args[targetIdx + 1] : undefined;

  if (targetIdx >= 0 && !targetId) {
    throw new Error("--target requires an id");
  }
  if (targetId && !RETENTION_TARGETS.some((t) => t.id === targetId)) {
    throw new Error(
      `unknown --target "${targetId}". known: ${RETENTION_TARGETS.map((t) => t.id).join(", ")}`,
    );
  }

  return { apply: args.includes("--apply"), targetId };
}

async function deleteKeys(keys: string[]): Promise<{ deleted: number; errors: number }> {
  const chunkSize = 1000;
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const result = await deleteMultipleFromR2(chunk);
    deleted += result.deleted.length;
    errors += result.errors.length;

    for (const error of result.errors.slice(0, 10)) {
      console.error(`FAIL ${error.key}: ${error.message}`);
    }

    console.log(
      `  delete progress: ${Math.min(i + chunkSize, keys.length)} / ${keys.length} ` +
        `(deleted=${deleted}, errors=${errors})`,
    );
  }

  return { deleted, errors };
}

async function main(): Promise<void> {
  assertTargetsAreSafe();
  const { apply, targetId } = parseArgs();

  if (apply) {
    assertR2WriteAllowed({ op: "r2-retention --apply (R2 legacy prefix deletion)" });
  }

  const targets = targetId
    ? RETENTION_TARGETS.filter((t) => t.id === targetId)
    : RETENTION_TARGETS;

  console.log(`mode: ${apply ? "APPLY (delete)" : "dry-run"}`);
  console.log(`targets: ${targets.length} / ${RETENTION_TARGETS.length}`);
  console.log("");

  let totalSize = 0;
  let totalCount = 0;
  let totalDeleted = 0;
  let totalErrors = 0;

  for (const target of targets) {
    const files = await listFromR2WithSize(target.prefix);
    const size = files.reduce((sum, f) => sum + f.size, 0);
    totalSize += size;
    totalCount += files.length;

    console.log(`## ${target.id}  (${target.prefix})`);
    console.log(`   ${target.reason}`);
    console.log(`   objects: ${files.length} / size: ${formatBytes(size)}`);

    if (files.length > 0) {
      for (const file of files.slice(0, 3)) {
        console.log(`   e.g. ${file.key}`);
      }
      if (files.length > 3) console.log(`   ... (+${files.length - 3})`);
    }

    if (apply && files.length > 0) {
      const result = await deleteKeys(files.map((f) => f.key));
      totalDeleted += result.deleted;
      totalErrors += result.errors;
    }

    console.log("");
  }

  console.log("=".repeat(60));
  console.log(`total objects: ${totalCount}`);
  console.log(`total size:    ${formatBytes(totalSize)}`);

  if (apply) {
    console.log(`deleted:       ${totalDeleted}`);
    console.log(`errors:        ${totalErrors}`);
    if (totalErrors > 0) process.exitCode = 1;
  } else {
    console.log("");
    console.log("dry-run only. Add --apply to delete.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
