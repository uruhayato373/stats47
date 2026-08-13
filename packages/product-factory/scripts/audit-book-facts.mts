#!/usr/bin/env -S npx tsx
/**
 * 書籍の書き下ろし章に書かれた数値を SSOT と突合する監査。
 *
 * 背景 (2026-08-12): `disposable-income-after-rent` の計算バグ (家賃を年額のまま月額から
 * 引いていた) を 2026-08-05 に修正したが、**その数値で書かれた書き下ろし章が直っていなかった**。
 * K-S1-01 の終章は「山形県が545,000円で全国1位、東京都は10位以上低い」と書いており、
 * 現行データ (東京 623,317円 1位 / 山形 564,741円 9位) と矛盾する。
 * ブログ本文には factual-check があるが**書籍の書き下ろし章には検証手段が無かった**。
 *
 * ★判定は「**その県の**その値が、書籍が扱う指標のどれかに存在するか」。
 *   値だけの照合は数千件の集合に対してほぼ必ず当たってしまい無意味
 *   (実測: 545,000 が静岡 552,182 に、176,000 が東京の家賃 175,694 に誤一致)。
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/audit-book-facts.mts            # 全書籍
 *   npx tsx packages/product-factory/scripts/audit-book-facts.mts --book K-S1-01
 *   npx tsx packages/product-factory/scripts/audit-book-facts.mts --json
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import {
  extractFactClaims,
  normalizePrefName,
  verifyClaim,
  type TruthSeries,
} from "../src/text/fact-claims";
import { extractKanjiClaims } from "../src/text/kanji-numeral";

const HERE = dirname(fileURLToPath(import.meta.url));
const PF_ROOT = resolve(HERE, "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/**
 * 未知のフラグを黙って無視しない。
 *
 * ★`--id K-S1-01` を渡すと全書籍が走り、合計値を 1 冊分と誤読する
 *   (2026-08-12 に実際に踏んだ)。絞ったつもりで絞れていない状態は、
 *   件数の誤読に直結するので起動時に止める。
 */
const KNOWN_FLAGS = new Set(["--book", "--json"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(
      `未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`,
    );
    process.exit(2);
  }
}

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly pref: string;
  readonly claimed: number;
  readonly unit: string;
  readonly actual: number | null;
  readonly metric: string | null;
  readonly context: string;
}

/** 書籍が扱う指標を SSOT から読み、県別の値・順位に整形する。 */
async function buildTruth(metricKeys: string[]): Promise<{ series: TruthSeries[]; missing: string[] }> {
  const series: TruthSeries[] = [];
  const missing: string[] = [];
  await Promise.all(
    metricKeys.map(async (key) => {
      try {
        const res = await fetch(`${R2}/app/ranking/${key}/values.json`);
        if (!res.ok) {
          missing.push(key);
          return;
        }
        const json = (await res.json()) as {
          partitions?: Array<{
            yearCode: string;
            values: Array<{ areaName: string; value: number; rank?: number; unit?: string }>;
          }>;
        };
        for (const p of json.partitions ?? []) {
          const byPref = new Map<string, number>();
          const rankByPref = new Map<string, number>();
          const unit = p.values.find((v) => v.unit)?.unit ?? "";
          for (const v of p.values) {
            const pref = normalizePrefName(v.areaName);
            if (!pref || !Number.isFinite(v.value)) continue;
            byPref.set(pref, v.value);
            if (typeof v.rank === "number") rankByPref.set(pref, v.rank);
          }
          if (byPref.size > 0) series.push({ metric: key, year: p.yearCode, byPref, rankByPref, unit });
        }
      } catch {
        missing.push(key);
      }
    }),
  );
  return { series, missing };
}

/** その書籍が扱う指標キーを集める (ranking 章の指定 + blog 章の記事が張るリンク)。 */
async function collectMetricKeys(book: (typeof KINDLE_BOOKS)[number]): Promise<string[]> {
  const keys = new Set<string>();
  // ★キャストしない。BookChapter は元々 blogSlug / rankingKeys を持っており、
  //   手書きの型 (string[]) は本物 (readonly string[]) と食い違って TS2352 になる。
  for (const ch of book.chapters) {
    for (const k of ch.rankingKeys ?? []) keys.add(k);
  }
  const slugs = book.chapters
    .map((c) => c.blogSlug)
    .filter((s): s is string => Boolean(s));
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetch(`${R2}/app/blog/${slug}/article.md`);
        if (!res.ok) return;
        const md = await res.text();
        for (const m of md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)) keys.add(m[1]);
      } catch {
        /* 1 記事取れなくても他で続行 */
      }
    }),
  );
  return [...keys];
}

async function main(): Promise<void> {
  assertKnownFlags();
  const only = arg("book");
  const asJson = process.argv.includes("--json");
  const books = KINDLE_BOOKS.filter((b) => (only ? b.id === only : true));
  const report: Array<Record<string, unknown>> = [];
  let totalBad = 0;
  let totalChecked = 0;
  let totalKanji = 0;

  for (const book of books) {
    const dir = join(PF_ROOT, "src/channels/kindle/manuscripts", book.id);
    if (!existsSync(dir)) continue;

    const { series, missing } = await buildTruth(await collectMetricKeys(book));
    const findings: Finding[] = [];
    let checked = 0;
    let kanjiLeft = 0;

    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const lines = readFileSync(join(dir, f), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.startsWith("#")) return;
        // 漢数字の数値主張が残っていないか (算用数字に統一する規約)
        for (const c of extractKanjiClaims(line)) {
          if (c.unit === "円" || c.unit === "位" || c.unit === "倍" || c.unit === "％") kanjiLeft++;
        }
        for (const claim of extractFactClaims(line)) {
          checked++;
          const v = verifyClaim(claim, series);
          if (v.kind !== "mismatch") continue;
          findings.push({
            file: f,
            line: i + 1,
            pref: claim.pref,
            claimed: claim.value,
            unit: claim.unit,
            actual: v.nearest?.actual ?? null,
            metric: v.nearest?.metric ?? null,
            context: line.slice(Math.max(0, claim.index - 26), claim.index + 26).replace(/\s+/g, " "),
          });
        }
      });
    }

    totalBad += findings.length;
    totalChecked += checked;
    totalKanji += kanjiLeft;
    report.push({
      book: book.id,
      title: book.title,
      metrics: new Set(series.map((s) => s.metric)).size,
      metricsMissing: missing.length,
      checked,
      kanjiLeft,
      findings,
    });

    if (!asJson) {
      const mark = findings.length === 0 && kanjiLeft === 0 ? "OK" : "NG";
      console.log(
        `${mark}  ${book.id.padEnd(9)} 指標${String(new Set(series.map((s) => s.metric)).size).padStart(3)}(取得不可${missing.length}) 照合${String(checked).padStart(4)} → 不一致 ${findings.length}${kanjiLeft ? ` / 漢数字残 ${kanjiLeft}` : ""}`,
      );
      for (const x of findings) {
        const actual = x.actual === null ? "該当なし" : `実測 ${x.actual.toLocaleString()}`;
        console.log(
          `      ${x.file}:${x.line} ${x.pref} ${x.claimed.toLocaleString()}${x.unit} ≠ ${actual} (${x.metric ?? "-"})`,
        );
        console.log(`         …${x.context}…`);
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
  } else {
    console.log(`\n合計: 照合 ${totalChecked} 件 / 不一致 ${totalBad} 件 / 漢数字残 ${totalKanji} 件`);
  }
  process.exitCode = totalBad > 0 || totalKanji > 0 ? 1 : 0;
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
