#!/usr/bin/env -S npx tsx
/**
 * 全書籍を実際にビルドして出品可否を判定し、`.claude/config/kdp-listings.json` の
 * `status` / `blockReason` を**実測から**更新する。
 *
 * ★なぜ要るか (2026-08-12)
 *   出品停止 (`blocked-thin`) は人手で書き込まれ、その `blockReason` に是正前の実測値
 *   (「本文 4,568 字 / 1章 152 字」) が残ったままだった。是正しても誰も戻さないし、
 *   逆に中身を直さずに status だけ戻すこともできてしまう。
 *   **出品可否はビルドの実測で決まる**ようにして、人の記憶に依存させない。
 *
 * 判定 (すべて `build-book.ts` の値をそのまま使う。ここに別の閾値を書かない):
 *   - `volumeOk`      総 20,000 字 / 1 章 800 字の床
 *   - `freshRatioOk`  KDP の書き下ろし 30%
 *   両方満たせば `draft` (出品準備完了)、欠ければ `blocked-thin` + 実測値の理由。
 *
 * **実公開はしない**。ここが変えるのは出品内容 SSOT の status だけで、KDP への
 * アップロードはオーナー工程 (`coconala-product-standards.md` §8)。
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/verify-publishable.mts            # 実測して表示のみ
 *   npx tsx packages/product-factory/scripts/verify-publishable.mts --apply    # listings も更新
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { buildBook } from "../src/channels/kindle/build-book";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const LISTINGS = join(REPO_ROOT, ".claude/config/kdp-listings.json");

const KNOWN_FLAGS = new Set(["--apply", "--json"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}

interface Measured {
  readonly id: string;
  readonly totalBody: number;
  readonly charsPerChapter: number;
  readonly freshRatio: number;
  readonly volumeOk: boolean;
  readonly freshRatioOk: boolean;
  readonly publishable: boolean;
  readonly reason?: string;
}

function reasonOf(m: Omit<Measured, "reason" | "publishable">): string | undefined {
  const bad: string[] = [];
  if (!m.volumeOk) bad.push(`本文 ${m.totalBody.toLocaleString()} 字 / 1章 ${m.charsPerChapter} 字 (床: 総20,000字・1章800字)`);
  if (!m.freshRatioOk) bad.push(`書き下ろし比率 ${(m.freshRatio * 100).toFixed(2)}% (KDP の 30% 未満)`);
  return bad.length > 0 ? bad.join(" / ") : undefined;
}

async function main(): Promise<void> {
  assertKnownFlags();
  const apply = process.argv.includes("--apply");
  const asJson = process.argv.includes("--json");

  const measured: Measured[] = [];
  for (const b of KINDLE_BOOKS) {
    // 表紙は判定に関係しないので作らない (実行時間を無駄にしない)
    const r = await buildBook(b, { skipCover: true });
    const base = {
      id: b.id,
      totalBody: r.freshChars + r.blogChars,
      charsPerChapter: r.charsPerChapter,
      freshRatio: r.freshRatio,
      volumeOk: r.volumeOk,
      freshRatioOk: r.freshRatioOk,
    };
    const reason = reasonOf(base);
    measured.push({ ...base, publishable: !reason, reason });
    if (!asJson) {
      const mark = reason ? "NG " : "OK ";
      console.log(
        `${mark} ${b.id.padEnd(9)} 本文 ${String(base.totalBody).padStart(6)} 字 / 1章 ${String(base.charsPerChapter).padStart(4)} 字 / 書き下ろし ${(base.freshRatio * 100).toFixed(2)}%`,
      );
      if (reason) console.log(`      理由: ${reason}`);
    }
  }

  const ok = measured.filter((m) => m.publishable).length;
  if (!asJson) console.log(`\n出品可: ${ok} / ${measured.length} 冊`);

  if (apply) {
    const doc = JSON.parse(readFileSync(LISTINGS, "utf8")) as {
      listings: Record<string, { status?: string; blockReason?: string }>;
    };
    let changed = 0;
    for (const m of measured) {
      const row = doc.listings[m.id];
      if (!row) continue;
      const next = m.publishable ? "draft" : "blocked-thin";
      // ★すでに listed (公開済み) のものを draft へ巻き戻さない。
      //   公開状態は KDP 側が真実源で、こちらが下げると出品操作が二重に走る。
      if (row.status === "listed") continue;
      if (row.status !== next || (row.blockReason ?? undefined) !== m.reason) {
        row.status = next;
        if (m.reason) row.blockReason = m.reason;
        else delete row.blockReason;
        changed += 1;
      }
    }
    writeFileSync(LISTINGS, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`✅ kdp-listings.json を更新しました (${changed} 件変更)`);
  } else if (!asJson) {
    console.log("（--apply を付けると kdp-listings.json の status を更新します）");
  }

  if (asJson) console.log(JSON.stringify({ ok, total: measured.length, books: measured }, null, 2));
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
