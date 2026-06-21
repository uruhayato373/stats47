import "dotenv/config";

/**
 * list-pending.ts — AI コンテンツが未生成 / 不完全なランキングを R2 から洗い出す (完全DBレス)。
 *
 * 旧版は D1 `metrics` テーブルを見ていたが (7569bd5c で削除)、本版は
 * **R2 の active ranking keys と各 ai-content.json の有無/欠損**だけで判定する。D1 非依存。
 *
 * 判定:
 *   - missing    : app/ranking/<key>/ai-content.json が R2 に存在しない
 *   - incomplete : 存在するが faq / regionalAnalysis / insights / prefectureCommentary のいずれかが空
 *   - complete   : 4 フィールドすべて埋まっている (件数整合・品質は audit-ai-content.mjs が担当)
 *
 * これは「次に何を生成すべきか」のワークリスト。生成は generate-parallel.ts またはエージェント、
 * 生成後の品質ゲートは audit-ai-content.mjs が担う。
 *
 * CLI:
 *   NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *     tsx packages/ai-content/src/scripts/list-pending.ts \
 *       [--area prefecture] [--limit N] [--missing-only] [--json] [--force]
 *
 *   --force : complete も含め全 active key を pending として出す (全再生成したいとき)
 *
 * 関連: build-input.ts / generate-parallel.ts / .claude/scripts/ai-content/audit-ai-content.mjs
 */

import { readActiveRankingKeysFromR2 } from "@stats47/ranking/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";

type Status = "missing" | "incomplete" | "complete";

interface PendingRow {
  rankingKey: string;
  status: Status;
  /** incomplete のとき、空だったフィールド名 */
  emptyFields?: string[];
}

function classify(row: AiContentSnapshotRow | null): {
  status: Status;
  emptyFields: string[];
} {
  if (!row) return { status: "missing", emptyFields: [] };
  const empty: string[] = [];
  if (!row.faq) empty.push("faq");
  if (!row.regionalAnalysis) empty.push("regionalAnalysis");
  if (!row.insights) empty.push("insights");
  if (!row.prefectureCommentary) empty.push("prefectureCommentary");
  return {
    status: empty.length === 0 ? "complete" : "incomplete",
    emptyFields: empty,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const areaIdx = argv.indexOf("--area");
  const areaType = (areaIdx >= 0 ? argv[areaIdx + 1] : "prefecture") as AreaType;
  const limitIdx = argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Infinity;
  const missingOnly = argv.includes("--missing-only");
  const asJson = argv.includes("--json");
  const force = argv.includes("--force");

  const keysResult = await readActiveRankingKeysFromR2(areaType);
  if (!isOk(keysResult)) {
    process.stderr.write(
      `[list-pending] active keys 取得失敗: ${keysResult.error.message}\n`,
    );
    process.exit(2);
  }
  const keys = keysResult.data.map((k) => k.rankingKey);
  if (keys.length === 0) {
    process.stderr.write(
      "[list-pending] active ranking key が 0 件 (R2 ranking-items snapshot が空の可能性)\n",
    );
  }

  const rows: PendingRow[] = [];
  // 直列でなく軽い並列 (R2 GET のみ、書込なし)。過負荷を避け 16 並列。
  const CONCURRENCY = 16;
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (rankingKey) => {
        const row = await fetchFromR2AsJson<AiContentSnapshotRow>(
          aiContentKeyPath(rankingKey),
        ).catch(() => null);
        const { status, emptyFields } = classify(row);
        return { rankingKey, status, emptyFields } as PendingRow;
      }),
    );
    rows.push(...results);
  }

  const pending = rows.filter((r) =>
    force
      ? true
      : missingOnly
        ? r.status === "missing"
        : r.status !== "complete",
  );
  const limited = Number.isFinite(limit) ? pending.slice(0, limit) : pending;

  const summary = {
    total: rows.length,
    missing: rows.filter((r) => r.status === "missing").length,
    incomplete: rows.filter((r) => r.status === "incomplete").length,
    complete: rows.filter((r) => r.status === "complete").length,
    pendingListed: limited.length,
  };

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ summary, pending: limited }, null, 2) + "\n",
    );
    return;
  }

  process.stdout.write(
    `=== AI Content Pending (area: ${areaType}${force ? " / force=全件" : ""}) ===\n`,
  );
  process.stdout.write(
    `total ${summary.total} | missing ${summary.missing} | incomplete ${summary.incomplete} | complete ${summary.complete}\n`,
  );
  process.stdout.write(`--- pending (${limited.length}) ---\n`);
  for (const r of limited) {
    const detail =
      r.status === "incomplete" && r.emptyFields?.length
        ? ` (空: ${r.emptyFields.join(",")})`
        : "";
    process.stdout.write(`[${r.status}] ${r.rankingKey}${detail}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(
    `[list-pending] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
