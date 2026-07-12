#!/usr/bin/env node
/**
 * SSDS クリーン候補 → metric config .ts を生成 (バッチ拡充)。
 * 各 spec: {statsDataId, cdCat01, key, title, unit, category, decimals, norm}
 * norm: "count"(人/世帯 → per_population+per_area) | "money"(→per_population) | "none"(率)
 *
 * 安全弁: 既存 title と重複する spec は自動スキップ (validate:config の dup-title 回避)。
 * seoTitle/seoDescription は投入後にデータから生成するため出さない。
 *
 * 実行後: npm run build:registry --workspace=@stats47/data-configs で registry 再生成。
 */
import fs from "node:fs";
import path from "node:path";

const DIR = "packages/data-configs/src/metrics";

// 既存 key / title (衝突回避)
const existKeys = new Set(), existTitles = new Set();
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith(".ts")) continue;
  const t = fs.readFileSync(path.join(DIR, f), "utf8");
  const k = t.match(/"key":\s*"([^"]+)"/); if (k) existKeys.add(k[1]);
  const ti = t.match(/"title":\s*"([^"]+)"/); if (ti) existTitles.add(ti[1]);
}

// GONE キー (410対象)。isActive:true で被ると ranking-key-consistency test が fail するので除外。
const goneKeys = new Set();
try {
  const gone = fs.readFileSync("apps/web/src/config/gone-ranking-keys.ts", "utf8");
  for (const m of gone.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)) goneKeys.add(m[1]);
} catch { /* ファイル無しは無視 */ }

const COLOR = {
  agriculture: "interpolateGreens", population: "interpolateBlues",
  economy: "interpolatePurples", laborwage: "interpolateOranges",
  socialsecurity: "interpolateReds", landweather: "interpolateGreens",
  educationsports: "interpolateBlues", administrativefinancial: "interpolateBlues",
  safetyenvironment: "interpolateOranges", infrastructure: "interpolateBlues",
  commercial: "interpolatePurples", miningindustry: "interpolateOranges",
};

function camel(key) {
  return key.split("-").map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join("");
}

function normOptions(norm, unit) {
  if (norm === "count") return [
    { type: "per_population", label: "人口10万人あたり", unit: `${unit}/10万人`, scaleFactor: 100000, decimalPlaces: 1 },
    { type: "per_area", label: "面積100km²あたり", unit: `${unit}/100km²`, scaleFactor: 100, decimalPlaces: 2 },
  ];
  if (norm === "money") return [
    { type: "per_population", label: "人口1人あたり", unit: `${unit}/人`, scaleFactor: 1, decimalPlaces: 2 },
  ];
  return [];
}

// lint と同じ正規化 (括弧内全除去 + 空白除去)
const normalizeTitle = (t) => t.replace(/[（(][^）)]*[）)]/g, "").replace(/\s/g, "").trim();
const normExist = new Set([...existTitles].map(normalizeTitle));

/** 末尾の括弧を subtitle に分離。title=基底 / subtitle=区別子 (redundant 回避) */
function splitTitle(full) {
  const m = full.match(/^(.*?)（([^）]+)）\s*$/);
  if (m && m[1].trim().length >= 2) return { title: m[1].trim(), subtitle: m[2].trim() };
  return { title: full, subtitle: null };
}

function emit(s, title, subtitle) {
  const ident = camel(s.key);
  const norm = normOptions(s.norm, s.unit);
  const cfg = {
    key: s.key, title, ...(subtitle ? { subtitle } : {}), unit: s.unit, category: s.category,
    source: { kind: "estat", statsDataId: s.statsDataId, cdCat01: s.cdCat01,
      displayName: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
    entities: ["prefecture", "city"],
    years: "all",
    yearFormat: "fiscal",
    visualization: { colorScheme: COLOR[s.category] || "interpolateBlues", colorSchemeType: "sequential", minValueType: "data-min" },
    display: { conversionFactor: 1, decimalPlaces: s.decimals ?? 0 },
    calculation: { isCalculated: false, normalizationOptions: norm },
    isActive: true, isFeatured: false, featuredOrder: 0,
  };
  const bodyStr = `import type { MetricConfig } from "../types";\n\nexport const ${ident}: MetricConfig = ${JSON.stringify(cfg, null, 2)};\n`;
  fs.writeFileSync(path.join(DIR, `${s.key}.ts`), bodyStr);
}

const BATCH = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let written = 0, skipped = [];
for (const s of BATCH) {
  // spec に subtitle 明示があれば優先、無ければ title の末尾括弧から自動分離
  const sp = s.subtitle ? { title: s.title, subtitle: s.subtitle } : splitTitle(s.title);
  if (existKeys.has(s.key) || goneKeys.has(s.key)) {
    skipped.push(goneKeys.has(s.key) ? `${s.key}(GONE)` : `${s.key}(key)`); continue;
  }
  if (existTitles.has(s.title)) { skipped.push(`${s.key}(exact-title)`); continue; }
  // subtitle が無く、正規化 title が既存と衝突 = 区別不能な重複 → skip
  if (!sp.subtitle && normExist.has(normalizeTitle(s.title))) { skipped.push(`${s.key}(norm-dup)`); continue; }
  emit(s, sp.title, sp.subtitle); written++;
  console.log(`  + ${s.key}  (${sp.title}${sp.subtitle ? " / " + sp.subtitle : ""})`);
}
console.log(`\n生成: ${written} / スキップ: ${skipped.length} ${skipped.join(",")}`);
