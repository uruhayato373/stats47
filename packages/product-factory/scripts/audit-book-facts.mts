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
 *
 * ★このゲートの上限 (2026-08-12 実測・過信しないこと)
 *   1 冊が 30 指標 × 複数年を扱うので、ある県の値を 10 倍・半分にしても**別指標の値に
 *   偶然一致する**ことがある。ミューテーション実測では、K-S2-01 で 3/3 検出できた一方
 *   K-S2-05 では 3 件中 1 件しか検出できなかった。捏造を全部止める道具ではない。
 *   確実に止まるのは「どの指標のどの年にも無い値」で、桁が大きく外れるほど検出率は上がる。
 *   意味の妥当性 (その指標をその文脈で語ってよいか) は人が読むしかない。
 *
 * ★守備範囲外: 著者が計算した派生値
 *   「自殺者の45.5%が65歳以上を占める」「輸送用機器が愛知県の出荷額の47.4%を占める」
 *   「一事業所当たりでは山口県が3,821百万円」のような構成比・平均は、SSOT の指標として
 *   存在しないので必ず「不一致」に出る。**これは誤検出であって原稿の誤りではない**。
 *   派生値の正しさは計算元の 2 数と式を人が見るしかない。
 *
 * ★S1 (ブログ再構成) の指摘は信頼できない — truth 集合が不完全だから
 *   S1 は章がブログ記事なので、`collectMetricKeys` が記事本文の `/ranking/` リンクからしか
 *   指標を集められない。実測で読み込めた指標は **5〜24 件** (S2/S3 は 28〜30 件) で、
 *   本文が語る数値の多くが truth に無い。県だけは他の指標で見つかるので `unknown-pref` に
 *   ならず、**「不一致」として出てしまう**。S1 の 8 冊 39 件はこの不完全さと派生値の混在で、
 *   原稿の誤りとは限らない。S1 を監査に載せるには truth 集合を広げる改修が要る
 *   (`docs/todo/05_機能バックログ.md` の KINDLE-AUDIT-S1-01)。
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
import { METRICS_REGISTRY } from "@stats47/data-configs";
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

/** 全角括弧・空白の揺れを畳んで、本文と指標名を突き合わせられるようにする。 */
function norm(t: string): string {
  return t.replace(/[（）]/g, (c) => (c === "（" ? "(" : ")")).replace(/\s+/g, "");
}

/** 指標の照合用タイトル (短すぎるものは誤マッチするので使わない)。 */
function titleOf(key: string): string {
  const t = (METRICS_REGISTRY as Record<string, { title?: string } | undefined>)[key]?.title ?? "";
  const n = norm(t);
  return n.length >= 5 ? n : "";
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
    // ★本文に出うる単位は、その書籍の指標の SSOT 単位そのもの。固定リストにすると
    //   「人泊」「人口千対」のような分母つき単位を落として誤検出を出す (2026-08-12 実測 36 件)。
    const claimUnits = [...new Set(series.map((s) => s.unit).filter((u): u is string => !!u))];
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
        // ★行が指標名を明示していても、その指標に限定してはならない (2026-08-12 実測)。
        //   1 行が複数の指標に触れるのが普通で、限定すると「高齢者割合は…東京都は66.8％」の
        //   66.8 (生産年齢人口割合) が高齢者割合と比べられて不一致になる。
        //   限定を入れた結果、誤検出が K-S2-01 で 1→22 件、K-S2-05 で 9→23 件に増えた。
        for (const claim of extractFactClaims(line, claimUnits)) {
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
