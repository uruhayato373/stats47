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

function emit(s) {
  const ident = camel(s.key);
  const norm = normOptions(s.norm, s.unit);
  const cfg = {
    key: s.key, title: s.title, unit: s.unit, category: s.category,
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
  const body = `import type { MetricConfig } from "../types";\n\nexport const ${ident}: MetricConfig = ${JSON.stringify(cfg, null, 2)};\n`;
  fs.writeFileSync(path.join(DIR, `${s.key}.ts`), body);
}

const BATCH = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let written = 0, skipped = [];
for (const s of BATCH) {
  if (existKeys.has(s.key) || existTitles.has(s.title)) { skipped.push(s.key); continue; }
  emit(s); written++;
  console.log(`  + ${s.key}  (${s.title})`);
}
console.log(`\n生成: ${written} / スキップ(重複): ${skipped.length} ${skipped.join(",")}`);
