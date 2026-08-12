#!/usr/bin/env -S npx tsx
/**
 * 書き下ろし章 (manuscripts/<bookId>/*.md) を機械検証する。
 *
 * ★なぜ要るか (2026-08-12)
 *   fresh 章は agent 艦隊が約 30 万字を書く。読んで確かめられる量ではないので、
 *   規約違反を決定的に弾く。特に**捏造**は、ブリーフに無い数値が本文に出ていないかで見る。
 *
 * 検査 (すべて書籍単位):
 *   1. ファイルが揃っているか (ブリーフが要求する本数)
 *   2. 目安字数の ±20% に入っているか
 *   3. 漢数字の数値主張が無いか (書籍は算用数字に統一)
 *   4. である調が混ざっていないか (ですます調で統一)
 *   5. 煽り語が無いか
 *   6. **本文の数値が SSOT (values.json) と整合するか** — ai-content 側と同じ number-audit で判定
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/verify-fresh.mts            # 全書籍
 *   npx tsx packages/product-factory/scripts/verify-fresh.mts --book K-S2-02
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { BOOK_RANKING_KEYS } from "../src/channels/kindle/book-ranking-keys";
import { fetchRankingValues } from "../src/data/load-ranking-values";
import { PREFECTURE_BY_CODE5 } from "../src/data/prefectures";
import { extractKanjiClaims } from "../src/text/kanji-numeral";
import { judgeField, type ValueRow } from "../src/channels/kindle/ai-content-composer";
import { METRICS_REGISTRY } from "@stats47/data-configs";

const PF_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANUSCRIPTS = join(PF_ROOT, "src/channels/kindle/manuscripts");

const KNOWN_FLAGS = new Set(["--book", "--json"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** 目安字数 (build-fresh-briefs.mts と同じ値。ずれると検証が意味を失う)。 */
const TARGETS: Readonly<Record<string, number>> = {
  "00-intro.md": 2500,
  "10-how-to-read.md": 2000,
  "20-bridge-a.md": 2300,
  "30-bridge-b.md": 2300,
  "50-cross-analysis.md": 6000,
  "90-synthesis.md": 5500,
  "20-profile-a.md": 2500,
  "30-profile-b.md": 2500,
};
/** S3 の synthesis は S2 より短い (ブリーフの表と一致させる)。 */
const S3_SYNTHESIS = 3500;

const HYPE = ["ワースト", "衝撃", "激減", "急増", "最悪", "驚愕", "ヤバい"];
/** である調の copula 文末 (ですます調への統一を検査)。 */
const DEARU = /(である|だった|ではない|だろう|のだ|のである)。/g;

interface Finding {
  readonly file: string;
  readonly level: "error" | "warn";
  readonly msg: string;
}

async function buildGate(bookId: string): Promise<{ values: ValueRow[]; unit?: string }> {
  // その書籍が載せる全指標の観測値をまとめて 1 つの文脈にする。
  // 単位が混ざるので unit は渡さない (スケール換算はせず、値の範囲だけで判定する)。
  const keys = BOOK_RANKING_KEYS[bookId] ?? [];
  const values: ValueRow[] = [];
  for (let i = 0; i < keys.length; i += 8) {
    const batch = keys.slice(i, i + 8);
    const got = await Promise.all(
      batch.map(async (k) => {
        try {
          const f = await fetchRankingValues(k);
          return f.values
            .filter((v): v is { code5: string; value: number } => v.value !== null)
            .map((v) => ({
              areaName: PREFECTURE_BY_CODE5.get(v.code5)?.name ?? v.code5,
              areaCode: v.code5,
              value: v.value,
            }));
        } catch {
          return [];
        }
      }),
    );
    for (const rows of got) values.push(...rows);
  }
  return { values };
}

async function verifyBook(bookId: string): Promise<Finding[]> {
  const out: Finding[] = [];
  const dir = join(MANUSCRIPTS, bookId);
  if (!existsSync(dir)) {
    return [{ file: bookId, level: "error", msg: "manuscripts ディレクトリが無い (未執筆)" }];
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  const isRegion = bookId.startsWith("K-S3-");
  const expected = isRegion ? 5 : 6;
  if (files.length < expected) {
    out.push({ file: bookId, level: "error", msg: `ファイル ${files.length}/${expected} 本 (不足)` });
  }

  const gate = await buildGate(bookId);

  for (const f of files) {
    const raw = readFileSync(join(dir, f), "utf8");
    const chars = raw.replace(/\s/g, "").length;
    const target = f === "90-synthesis.md" && isRegion ? S3_SYNTHESIS : TARGETS[f];
    if (target) {
      const lo = Math.round(target * 0.8);
      const hi = Math.round(target * 1.2);
      if (chars < lo) out.push({ file: `${bookId}/${f}`, level: "error", msg: `${chars}字 < 目安 ${target} の 80% (${lo})` });
      else if (chars > hi) out.push({ file: `${bookId}/${f}`, level: "warn", msg: `${chars}字 > 目安 ${target} の 120% (${hi})` });
    }

    const kanji = extractKanjiClaims(raw).filter((c) => ["円", "位", "倍", "％"].includes(c.unit));
    if (kanji.length > 0) {
      out.push({ file: `${bookId}/${f}`, level: "error", msg: `漢数字の数値主張 ${kanji.length} 件 (例: ${kanji[0].raw}${kanji[0].unit})` });
    }

    const dearu = [...raw.matchAll(DEARU)];
    if (dearu.length > 0) {
      out.push({ file: `${bookId}/${f}`, level: "error", msg: `である調 ${dearu.length} 箇所 (例: ${dearu[0][0]})` });
    }

    for (const w of HYPE) {
      if (raw.includes(w)) out.push({ file: `${bookId}/${f}`, level: "error", msg: `煽り語「${w}」` });
    }

    // ★数値照合: ai-content 側と同じ number-audit で、本文の数値が実データの範囲に収まるか見る。
    //   書籍が扱う全指標を 1 つの文脈にしているので、範囲を大きく外れた数値だけが出る
    //   (誤検知を避けるための保守的な判定。桁違いの捏造を止めるのが狙い)。
    const v = judgeField(raw, gate);
    if (!v.ok && v.reason && /範囲外/.test(v.reason)) {
      out.push({ file: `${bookId}/${f}`, level: "error", msg: `SSOT と整合しない数値 — ${v.reason}` });
    }
  }
  return out;
}

async function main(): Promise<void> {
  assertKnownFlags();
  const only = arg("book");
  const asJson = process.argv.includes("--json");
  const books = KINDLE_BOOKS.filter((b) => (only ? b.id === only : !b.id.startsWith("K-S1-")));

  let errors = 0;
  const report: Record<string, Finding[]> = {};
  for (const b of books) {
    const findings = await verifyBook(b.id);
    report[b.id] = findings;
    const e = findings.filter((x) => x.level === "error").length;
    errors += e;
    if (!asJson) {
      const mark = e > 0 ? "NG " : findings.length > 0 ? "WARN" : "OK ";
      console.log(`${mark} ${b.id.padEnd(9)} error ${e} / warn ${findings.length - e}`);
      for (const x of findings) console.log(`      [${x.level}] ${x.file}: ${x.msg}`);
    }
  }
  if (asJson) console.log(JSON.stringify({ totalErrors: errors, report }, null, 2));
  else console.log(`\n合計: ${books.length} 冊 / error ${errors} 件`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
