#!/usr/bin/env node
/**
 * build-kakei-quantity-price.mjs — 県庁所在市の食卓を「支出額 = 数量 × 価格」で分解する接地器。
 *
 * 家計調査の品目で数量 (consumption-quantity) と支出額 (consumption-expenditure) の両方を持つ
 * metric ペアを全件集め、最新の共通年で 47 県庁所在市平均 = 100 の指数を作る:
 *   数量指数 = 数量 / 47市平均数量 × 100
 *   価格指数 = (支出額/数量) / (平均支出額/平均数量) × 100
 *   支出指数 = 支出額 / 47市平均支出額 × 100
 * 指定した県の品目を 4 区分 (多く高く / 高く / 多く / 支出額が大きい) に分け、
 * ブログ記事の findings カード (data/<name>-findings.json + .source.json) と、
 * 執筆用の全品目表 (<slug>/kakei-quantity-price.json — data/ の外) を書く。
 *
 * 数値の出典は R2 `app/stats/<key>/values.json` だけ。全国値の行は無いので
 * 「47 県庁所在市の単純平均」を基準にする (家計調査の全国値とは一致しない。記事側で明記する)。
 *
 * Usage:
 *   node .claude/scripts/blog/build-kakei-quantity-price.mjs --slug <slug> --pref <5桁 or 2桁コード>
 *     [--base-dir docs/21_ブログ記事原稿] [--data-name <name>] [--threshold 120] [--top 4] [--all-items]
 *   既定は食料 (品目コード 01 系 = 125 ペア) のみ。--all-items で被服・家電なども含める。
 *   node .claude/scripts/blog/build-kakei-quantity-price.mjs --list   # 対象ペアと共通年だけ表示
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const METRICS_DIR = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
const PREFECTURES_JSON = path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json");
const CACHE_DIR = path.join(os.tmpdir(), "stats47-kakei-quantity-price-cache");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const LIST_ONLY = args.includes("--list");
const SLUG = getArg("--slug");
const PREF_RAW = getArg("--pref");
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
const THRESHOLD = Number(getArg("--threshold", "120"));
const TOP = Number(getArg("--top", "4"));
// 既定は食料 (e-Stat 家計調査の品目コード 01 系) だけ。被服・家電などまで含めるときは --all-items。
const ALL_ITEMS = args.includes("--all-items");
if (!LIST_ONLY && (!SLUG || !PREF_RAW)) {
  console.error("usage: --slug <slug> --pref <code> [--base-dir <dir>] [--data-name <name>] [--threshold 120] [--top 4] | --list");
  process.exit(1);
}

function readMetric(key) {
  const file = path.join(METRICS_DIR, `${key}.ts`);
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, "utf8");
  return {
    key,
    title: src.match(/"title":\s*"([^"]+)"/)?.[1] || key,
    unit: src.match(/"unit":\s*"([^"]+)"/)?.[1] || "",
    isActive: /"isActive":\s*true/.test(src),
    cdCat01: src.match(/"cdCat01":\s*"(\d+)"/)?.[1] || "",
  };
}

function listPairs() {
  const files = fs.readdirSync(METRICS_DIR);
  const qty = files.filter((f) => f.endsWith("-consumption-quantity.ts")).map((f) => f.replace(/\.ts$/, ""));
  return qty
    .map((q) => {
      const base = q.replace(/-consumption-quantity$/, "");
      const e = `${base}-consumption-expenditure`;
      const qm = readMetric(q);
      const em = readMetric(e);
      if (!qm || !em || !qm.isActive || !em.isActive) return null;
      if (!ALL_ITEMS && !qm.cdCat01.startsWith("01")) return null;
      return { base, item: qm.title.replace(/消費量$/, ""), quantityKey: q, expenditureKey: e, quantityUnit: qm.unit };
    })
    .filter(Boolean);
}

async function fetchValues(key) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cache = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(cache) && Date.now() - fs.statSync(cache).mtimeMs < 24 * 3600 * 1000) {
    return JSON.parse(fs.readFileSync(cache, "utf8"));
  }
  const url = `${R2_BASE}/app/stats/${key}/values.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} (${url})`);
  const json = await res.json();
  fs.writeFileSync(cache, JSON.stringify(json));
  return json;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

function latestCommonYear(qtyPayload, expPayload) {
  const years = (rows) => new Set(rows.filter((r) => r.value != null && Number.isFinite(r.value)).map((r) => String(r.yearCode)));
  const qy = years(qtyPayload.rows || []);
  const ey = years(expPayload.rows || []);
  const common = [...qy].filter((y) => ey.has(y)).sort();
  return common.length ? common[common.length - 1] : null;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (x) => Math.round(x * 10) / 10;

async function main() {
  const pairs = listPairs();
  const prefectures = JSON.parse(fs.readFileSync(PREFECTURES_JSON, "utf8"));
  const payloads = await mapLimit(pairs, 8, async (p) => {
    try {
      const [q, e] = await Promise.all([fetchValues(p.quantityKey), fetchValues(p.expenditureKey)]);
      return { ...p, q, e };
    } catch (err) {
      console.error(`[warn] skip ${p.base}: ${err.message}`);
      return null;
    }
  });
  const usable = payloads.filter(Boolean);

  // 全ペアで最も多い「最新共通年」を採用し、それを持たないペアは外す (年を混ぜない)
  const yearCount = new Map();
  for (const p of usable) {
    p.year = latestCommonYear(p.q, p.e);
    if (p.year) yearCount.set(p.year, (yearCount.get(p.year) || 0) + 1);
  }
  const year = [...yearCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!year) {
    console.error("[error] 共通年が取れない");
    process.exit(1);
  }
  const inYear = usable.filter((p) => p.year === year);

  // 品目ごとに 47 市の指数を計算
  const table = inYear
    .map((p) => {
      const rowsQ = new Map(p.q.rows.filter((r) => String(r.yearCode) === year && r.value != null).map((r) => [r.areaCode, r.value]));
      const rowsE = new Map(p.e.rows.filter((r) => String(r.yearCode) === year && r.value != null).map((r) => [r.areaCode, r.value]));
      const codes = [...rowsQ.keys()].filter((c) => rowsE.has(c) && rowsQ.get(c) > 0);
      if (codes.length < 40) return null;
      const mq = mean(codes.map((c) => rowsQ.get(c)));
      const me = mean(codes.map((c) => rowsE.get(c)));
      const priceRef = me / mq;
      const cities = Object.fromEntries(
        codes.map((c) => {
          const q = rowsQ.get(c);
          const e = rowsE.get(c);
          return [c, { quantity: q, expenditure: e, quantityIndex: r1((q / mq) * 100), expenditureIndex: r1((e / me) * 100), priceIndex: r1((e / q / priceRef) * 100) }];
        }),
      );
      // 順位 (支出額の降順) — 記事が順位を語るときの根拠
      const ranked = codes.map((c) => [c, rowsE.get(c)]).sort((a, b) => b[1] - a[1]);
      ranked.forEach(([c], i) => (cities[c].expenditureRank = i + 1));
      const rankedQ = codes.map((c) => [c, rowsQ.get(c)]).sort((a, b) => b[1] - a[1]);
      rankedQ.forEach(([c], i) => (cities[c].quantityRank = i + 1));
      return { ...p, cityCount: codes.length, meanQuantity: mq, meanExpenditure: me, cities };
    })
    .filter(Boolean);

  if (LIST_ONLY) {
    console.log(`year=${year} pairs=${table.length} (fetched ${usable.length}, in-year ${inYear.length})`);
    for (const t of table) console.log(`${t.base}\t${t.item}\t${t.quantityUnit}\t${t.cityCount}`);
    return;
  }

  const prefCode = PREF_RAW.length === 2 ? `${PREF_RAW}000` : PREF_RAW;
  const pref = prefectures.find((p) => p.prefCode === prefCode);
  if (!pref) {
    console.error(`[error] 都道府県コードが不正: ${PREF_RAW}`);
    process.exit(1);
  }
  const hi = THRESHOLD;
  const lo = 200 - THRESHOLD; // 120 → 80
  const rows = table
    .filter((t) => t.cities[prefCode])
    .map((t) => {
      const c = t.cities[prefCode];
      let category;
      if (c.quantityIndex >= hi && c.priceIndex >= hi) category = "多く高く";
      else if (c.priceIndex >= hi && c.quantityIndex < hi) category = "高く";
      else if (c.quantityIndex >= hi && c.priceIndex < hi) category = "多く";
      else if (c.expenditureIndex >= hi) category = "支出額大";
      else if (c.quantityIndex <= lo && c.priceIndex <= lo) category = "少なく安く";
      else if (c.quantityIndex <= lo) category = "少なく";
      else if (c.priceIndex <= lo) category = "安く";
      else category = "平均並み";
      return {
        base: t.base,
        item: t.item,
        quantityKey: t.quantityKey,
        expenditureKey: t.expenditureKey,
        quantityUnit: t.quantityUnit,
        cityCount: t.cityCount,
        ...c,
        category,
      };
    });
  // カードには「他の〜」(分類残余の品目) を出さない (全品目表には残す)
  const byCat = (cat) => rows.filter((r) => r.category === cat && !/^他の/.test(r.item)).sort((a, b) => b.expenditureIndex - a.expenditureIndex);
  const categories = {
    多く高く: { heading: "多く・高く買う（数量も価格も平均より高い）", items: byCat("多く高く") },
    高く: { heading: "高く買う（数量は平均並み以下でも単価が高い）", items: byCat("高く") },
    多く: { heading: "多く買う（単価は平均並み以下でも量が多い）", items: byCat("多く") },
    支出額大: { heading: "支出額が大きい（数量・価格とも少し上回る）", items: byCat("支出額大") },
  };
  const fmt = (r) => `${r.item}（数量${Math.round(r.quantityIndex)}・価格${Math.round(r.priceIndex)}）`;
  const findings = Object.values(categories).map((c) => ({
    heading: c.heading,
    text: c.items.length ? c.items.slice(0, TOP).map(fmt).join("、") + (c.items.length > TOP ? ` ほか${c.items.length - TOP}品目` : "") : "該当なし",
  }));

  const shortPref = pref.prefName === "北海道" ? "北海道" : pref.prefName.replace(/[都府県]$/, "");
  const dataName = getArg("--data-name", `${SLUG.replace(/-food-culture$/, "")}-quantity-price`);
  const outDir = path.join(PROJECT_ROOT, BASE_DIR, SLUG);
  fs.mkdirSync(path.join(outDir, "data"), { recursive: true });
  const findingsJson = {
    chartType: "summary",
    title: `${shortPref}の食卓を数量×価格で分解（${year}年・47県庁所在市平均=100）`,
    findings,
  };
  const usedKeys = Object.values(categories).flatMap((c) => c.items.slice(0, TOP).flatMap((r) => [r.quantityKey, r.expenditureKey]));
  const source = {
    kind: "derived",
    label: findingsJson.title,
    unit: "指数 (47県庁所在市平均=100)",
    year,
    prefCode,
    prefName: pref.prefName,
    source: "r2:app/stats/<item>-consumption-quantity/values.json + r2:app/stats/<item>-consumption-expenditure/values.json",
    derivedFrom: [...new Set(usedKeys)],
    transform: `品目ごとに 47 県庁所在市の単純平均を 100 とし、数量指数 = 数量/平均、価格指数 = (支出額/数量)/(平均支出額/平均数量)、支出指数 = 支出額/平均。閾値 ${hi} 以上を「多い/高い」、${lo} 以下を「少ない/安い」として 4 区分に分類 (対象 ${table.length} 品目・両系列が揃う市が 40 未満の品目は除外)`,
    restore: `node .claude/scripts/blog/build-kakei-quantity-price.mjs --slug ${SLUG} --pref ${prefCode} --data-name ${dataName} --threshold ${hi} --top ${TOP}${ALL_ITEMS ? " --all-items" : ""}`,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(path.join(outDir, "data", `${dataName}-findings.json`), JSON.stringify(findingsJson, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "data", `${dataName}-findings.source.json`), JSON.stringify(source, null, 2) + "\n");
  // 執筆用の全品目表 (data/ の外 = チャート生成・factual-check の対象にしない)
  const full = {
    prefCode,
    prefName: pref.prefName,
    year,
    reference: "47県庁所在市の単純平均=100 (家計調査の全国値ではない)",
    threshold: { high: hi, low: lo },
    counts: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.items.length])),
    countsNote: "counts は「他の〜」の残余品目を除いた数。記事に品目数を書くなら rows を数えるか「他の〜を除く」と明記する",
    rows: rows.sort((a, b) => b.expenditureIndex - a.expenditureIndex),
  };
  fs.writeFileSync(path.join(outDir, "kakei-quantity-price.json"), JSON.stringify(full, null, 2) + "\n");

  console.error(
    `[ok] ${pref.prefName} ${year}年: ${rows.length} 品目 → ` +
      Object.entries(full.counts)
        .map(([k, v]) => `${k} ${v}`)
        .join(" / ") +
      `\n     data/${dataName}-findings.json (+ .source.json) / kakei-quantity-price.json → ${path.relative(PROJECT_ROOT, outDir)}`,
  );
}
main().catch((e) => {
  console.error(`[error] ${e.message}`);
  process.exit(1);
});
