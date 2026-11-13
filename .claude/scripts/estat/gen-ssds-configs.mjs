#!/usr/bin/env node
/**
 * SSDS クリーン候補 → metric config .ts を生成 (バッチ拡充)。
 * 各 spec: {statsDataId, cdCat01, key, title, unit, category, decimals, norm}
 * norm: "count"(人/世帯 → per_population+per_area) | "money"(→per_population) | "none"(率)
 *
 * 安全弁: 既存 title と重複する spec は自動スキップ (validate:config の dup-title 回避)。
 * seoTitle/seoDescription は投入後にデータから生成するため出さない。
 *
 * 年の区切り (yearFormat) は固定で書かず、e-Stat の定義の控えから決める (lib/ssds-year-format.mjs)。
 * 2026-10-21 まで全指標に "fiscal" を固定で書いていて、国勢調査・犯罪統計などが「2020年度」と表示されていた。
 * 定義から決まらない spec は書かずに exit 1 で止まる (年度か暦年のどちらかへ倒さない)。そのときは調査の年の呼び方を
 * 一次資料で確かめて data/estat/ssds-year-format/decisions.json の surveyNaming に足してから、もう一度実行する。
 *
 *   node .claude/scripts/estat/gen-ssds-configs.mjs <batch.json>            書き出す
 *   node .claude/scripts/estat/gen-ssds-configs.mjs <batch.json> --dry-run  書かずに、書くはずの内容を標準出力へ出す
 *
 * 実行後: npm run build:registry --workspace=@stats47/data-configs で registry 再生成。
 */
import fs from "node:fs";
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRules, decideYearFormat, indexDefinitions } from "./lib/ssds-year-format.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const DIR = path.join(PROJECT_ROOT, datasetDir("metrics.definitions"));
const DRY_RUN = process.argv.includes("--dry-run");
const readDataset = (id) => JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, datasetPath(id)), "utf8"));
const definitionIndex = indexDefinitions(readDataset("estat.ssds-definitions"));
const yearFormatRules = buildRules(readDataset("estat.ssds-year-format-decisions"));

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
  const gone = readDataset("site.gone-ranking-keys");
  for (const row of gone.keys) goneKeys.add(row.key);
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

function emit(s, title, subtitle, yearFormat) {
  const ident = camel(s.key);
  const norm = normOptions(s.norm, s.unit);
  const cfg = {
    isActive: true,
    key: s.key, title, ...(subtitle ? { subtitle } : {}), unit: s.unit, category: s.category,
    source: { kind: "estat", statsDataId: s.statsDataId, cdCat01: s.cdCat01,
      displayName: "社会・人口統計体系", url: "https://www.stat.go.jp/data/ssds/index.htm" },
    entities: ["prefecture", "city"],
    years: "all",
    yearFormat,
    visualization: { colorScheme: COLOR[s.category] || "interpolateBlues", colorSchemeType: "sequential",  },
    display: { conversionFactor: 1, decimalPlaces: s.decimals ?? 0 },
    calculation: { isCalculated: false, normalizationOptions: norm },
  };
  const cfgText = JSON.stringify(cfg, null, 2).replace('"visualization": {', '"visualization": {\n    ...DEFAULT_METRIC_PRESENTATION,');
  const bodyStr = `import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";\nimport type { MetricConfig } from "../../packages/data-configs/src/types";\n\nexport const ${ident}: MetricConfig = ${cfgText};\n`;
  if (DRY_RUN) console.log(`--- ${s.key}.ts ---\n${bodyStr}`);
  else fs.writeFileSync(path.join(DIR, `${s.key}.ts`), bodyStr);
}

const BATCH = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let written = 0, skipped = [];
const undecided = [];
for (const s of BATCH) {
  // spec に subtitle 明示があれば優先、無ければ title の末尾括弧から自動分離
  const sp = s.subtitle ? { title: s.title, subtitle: s.subtitle } : splitTitle(s.title);
  if (existKeys.has(s.key) || goneKeys.has(s.key)) {
    skipped.push(goneKeys.has(s.key) ? `${s.key}(GONE)` : `${s.key}(key)`); continue;
  }
  if (existTitles.has(s.title)) { skipped.push(`${s.key}(exact-title)`); continue; }
  // subtitle が無く、正規化 title が既存と衝突 = 区別不能な重複 → skip
  if (!sp.subtitle && normExist.has(normalizeTitle(s.title))) { skipped.push(`${s.key}(norm-dup)`); continue; }
  const decision = decideYearFormat({ statsDataId: s.statsDataId, cdCat01: s.cdCat01 }, definitionIndex, yearFormatRules);
  if (!decision.yearFormat) { undecided.push(`${s.key} (${s.cdCat01}): ${decision.reason}`); continue; }
  emit(s, sp.title, sp.subtitle, decision.yearFormat); written++;
  console.log(`  + ${s.key}  (${sp.title}${sp.subtitle ? " / " + sp.subtitle : ""})  [${decision.yearFormat}]`);
}
console.log(`\n${DRY_RUN ? "生成 (dry-run・書いていない)" : "生成"}: ${written} / スキップ: ${skipped.length} ${skipped.join(",")}`);
if (undecided.length > 0) {
  console.error(`\n年の区切り (yearFormat) が定義から決まらないので書かなかった: ${undecided.length} 件`);
  for (const line of undecided) console.error(`  ✗ ${line}`);
  console.error(`調査の年の呼び方を一次資料で確かめて ${datasetPath("estat.ssds-year-format-decisions")} の surveyNaming に足してから、もう一度実行する`);
  process.exitCode = 1;
}
