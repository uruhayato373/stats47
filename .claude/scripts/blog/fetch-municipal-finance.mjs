#!/usr/bin/env node
/**
 * fetch-municipal-finance.mjs — F型(市区町村内格差)記事のデータ接地。
 *
 * 出典は総務省「地方財政状況調査(決算カード)」を取り込んだ
 * `apps/web/public/finance-cards/cities/<2桁県コード>.json` と `similar-averages.json`。
 * e-Stat には団体別の決算カードが無い (`.claude/rules/estat-api.md`) ため、この JSON が正典。
 * 数値はここからのみ取り、他所から補完しない (捏造防止・factual-check 対象)。
 *
 * 出力 (3点セット。§blog-data-schema §1.5):
 *   <name>-finance-index-ranking.json  財政力指数 (団体別。上位=自主財源が厚い)
 *   <name>-finance-debt-ranking.json   実質公債費比率 (団体別。高い=返済負担が重い)
 *   <name>-finance-timeseries.json     県内の最高 / 中央 / 最低 財政力指数の推移
 *   + それぞれの .source.json
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-municipal-finance.mjs --slug <slug> --pref <5桁コード>
 *     [--year 2024] [--from-year 2020] [--base-dir docs/21_ブログ記事原稿] [--data-name <name>]
 *
 * exit: 0 = ok / 1 = 引数不正 / 3 = データ欠落・不整合
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const CARDS_DIR = path.join(PROJECT_ROOT, "apps/web/public/finance-cards/cities");
const SIMILAR_JSON = path.join(PROJECT_ROOT, "apps/web/public/finance-cards/similar-averages.json");
const PREFECTURES_JSON = path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SLUG = getArg("--slug");
const PREF = getArg("--pref");
const YEAR = getArg("--year", "2024");
const FROM_YEAR = Number(getArg("--from-year", "2020"));
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
if (!SLUG || !PREF) {
  console.error("usage: --slug <slug> --pref <5桁コード> [--year YYYY] [--from-year YYYY] [--base-dir <dir>] [--data-name <name>]");
  process.exit(1);
}
const DATA_NAME = getArg("--data-name", SLUG);

const PREFS = JSON.parse(fs.readFileSync(PREFECTURES_JSON, "utf8"));
const SELF = PREFS.find((p) => p.prefCode === PREF)?.prefName;
if (!SELF) {
  console.error(`[error] 都道府県コードが実在しない: ${PREF}`);
  process.exit(1);
}

const cardFile = path.join(CARDS_DIR, `${PREF.slice(0, 2)}.json`);
if (!fs.existsSync(cardFile)) {
  console.error(`[error] 決算カードが無い: ${path.relative(PROJECT_ROOT, cardFile)}`);
  process.exit(3);
}
const CARDS = JSON.parse(fs.readFileSync(cardFile, "utf8"));
const SIMILAR = JSON.parse(fs.readFileSync(SIMILAR_JSON, "utf8"));

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function collect(year, field) {
  return Object.entries(CARDS)
    .map(([name, card]) => ({ name, type: card.type, value: card.years?.[year]?.[field] }))
    .filter((r) => Number.isFinite(r.value));
}

function ranking(rows, { title, label, unit, palette, decimals }) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  return {
    title,
    subtitle: `${YEAR}年度`,
    label,
    unit,
    year: YEAR,
    source: "総務省 地方財政状況調査 (決算カード)",
    palette,
    decimalPlaces: decimals,
    generatedBy: "fetch-municipal-finance.mjs",
    data: sorted.map((r, i) => ({
      rank: i + 1,
      areaName: r.name,
      pref: r.name,
      value: r.value,
      label,
      unit,
    })),
  };
}

function main() {
  const fi = collect(YEAR, "fiscalIndex");
  const ds = collect(YEAR, "debtServiceRatio");
  if (fi.length < 10) {
    console.error(`[error] ${SELF} の ${YEAR} 年度 財政力指数が ${fi.length} 団体しかない (格差を論じるには足りない)`);
    process.exit(3);
  }
  const uniq = new Set(fi.map((r) => r.name));
  if (uniq.size !== fi.length) {
    console.error(`[error] 団体名が重複している (${fi.length} 行 / ${uniq.size} 名)`);
    process.exit(3);
  }
  if (Math.min(...fi.map((r) => r.value)) === Math.max(...fi.map((r) => r.value))) {
    console.error(`[error] 財政力指数が全団体で同じ値。格差の記事にならない`);
    process.exit(3);
  }

  // 時系列: 県内の最高 / 中央 / 最低。年ごとに観測できた団体だけで算出し、欠年を 0 で埋めない。
  const hi = [];
  const mid = [];
  const lo = [];
  for (let y = FROM_YEAR; y <= Number(YEAR); y += 1) {
    const rows = collect(String(y), "fiscalIndex");
    if (rows.length < 10) continue;
    const vals = rows.map((r) => r.value);
    hi.push({ year: String(y), value: Math.max(...vals) });
    mid.push({ year: String(y), value: Number(median(vals).toFixed(3)) });
    lo.push({ year: String(y), value: Math.min(...vals) });
  }
  if (hi.length < 3) {
    console.error(`[error] 時系列が ${hi.length} 年分しか取れない`);
    process.exit(3);
  }

  const outDir = path.join(PROJECT_ROOT, BASE_DIR, SLUG, "data");
  fs.mkdirSync(outDir, { recursive: true });

  const commonSource = {
    kind: "manual",
    prefCode: PREF,
    prefName: SELF,
    year: YEAR,
    sourceName: "総務省 地方財政状況調査 (決算カード)",
    source: "https://www.soumu.go.jp/iken/zaisei/card.html",
    upstream: `repo:apps/web/public/finance-cards/cities/${PREF.slice(0, 2)}.json`,
    restore: `node .claude/scripts/blog/fetch-municipal-finance.mjs --slug ${SLUG} --pref ${PREF} --year ${YEAR} --from-year ${FROM_YEAR} --data-name ${DATA_NAME}`,
    generatedBy: "fetch-municipal-finance.mjs",
    fetchedAt: new Date().toISOString(),
  };
  const write = (name, payload, extra) => {
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(payload, null, 2) + "\n");
    fs.writeFileSync(path.join(outDir, `${name}.source.json`), JSON.stringify({ ...commonSource, ...extra }, null, 2) + "\n");
  };

  write(
    `${DATA_NAME}-finance-index-ranking`,
    ranking(fi, {
      title: `${SELF}の市町村別 財政力指数`,
      label: "財政力指数",
      unit: "",
      palette: "blue",
      decimals: 2,
    }),
    { label: `${SELF}の市町村別 財政力指数`, unit: "", transform: `${YEAR} 年度の fiscalIndex を降順に並べる (${fi.length} 団体)` },
  );
  write(
    `${DATA_NAME}-finance-debt-ranking`,
    ranking(ds, {
      title: `${SELF}の市町村別 実質公債費比率`,
      label: "実質公債費比率",
      unit: "％",
      palette: "red",
      decimals: 1,
    }),
    { label: `${SELF}の市町村別 実質公債費比率`, unit: "％", transform: `${YEAR} 年度の debtServiceRatio を降順に並べる (${ds.length} 団体)` },
  );
  write(
    `${DATA_NAME}-finance-timeseries`,
    {
      title: `${SELF}の市町村 財政力指数の推移`,
      unit: "",
      label: "財政力指数",
      year: YEAR,
      source: "総務省 地方財政状況調査 (決算カード)",
      generatedBy: "fetch-municipal-finance.mjs",
      series: [
        { label: "県内で最も高い団体", data: hi },
        { label: "県内の中央値", data: mid },
        { label: "県内で最も低い団体", data: lo },
      ],
    },
    { label: `${SELF}の財政力指数の推移`, unit: "", transform: `${hi[0].year}〜${hi[hi.length - 1].year} 年度。各年に観測できた団体の最大 / 中央値 / 最小` },
  );

  // 類似団体平均は本文の比較材料。図にはせず digest で示す (団体区分ごとの平均なので単一の図にならない)
  const fiSorted = [...fi].sort((a, b) => b.value - a.value);
  const top = fiSorted[0];
  const bottom = fiSorted[fiSorted.length - 1];
  const dsSorted = [...ds].sort((a, b) => b.value - a.value);
  const simTop = SIMILAR[top.type]?.[YEAR]?.fiscalIndex;
  const simBottom = SIMILAR[bottom.type]?.[YEAR]?.fiscalIndex;
  console.error(
    `[ok] ${SELF} (${PREF}) ${YEAR}年度 — ${fi.length} 団体\n` +
      `     財政力指数 最高: ${top.name} ${top.value} (${top.type}${simTop != null ? ` / 類似団体平均 ${simTop.toFixed(3)}` : ""})\n` +
      `     財政力指数 最低: ${bottom.name} ${bottom.value} (${bottom.type}${simBottom != null ? ` / 類似団体平均 ${simBottom.toFixed(3)}` : ""})\n` +
      `     中央値 ${median(fi.map((r) => r.value)).toFixed(2)} / 実質公債費比率 最高: ${dsSorted[0].name} ${dsSorted[0].value}％\n` +
      `     時系列 ${hi.length} 年分 / → ${path.relative(PROJECT_ROOT, outDir)}`,
  );
}
main();
