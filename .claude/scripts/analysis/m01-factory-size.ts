#!/usr/bin/env tsx
/**
 * M01 の分析: 製造業が強い市の差は、工場の数か 1 工場の大きさか。
 * 台帳 data/content/analyses.json・figures.json の試作の 1 本目で、結論の数字と図をここから再現する。
 *
 *   npm run analysis:frame -- --spec .claude/scripts/analysis/examples/m01-manufacturing.json --out .local/analysis/m01/frame.json
 *   npx tsx .claude/scripts/analysis/m01-factory-size.ts .local/analysis/m01/frame.json .local/analysis/m01
 *
 * 表は市区町村。図は既存の散布図の型が 47 都道府県専用なので、県へ足し上げて描く。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { CHART_THEMES } from "../../../apps/remotion/src/features/data-cards/chart-theme";
import { renderGroupedBarsChart, type GroupedBarChart } from "../../../apps/admin/lib/template-grouped-bars";
import { renderRelationshipScatterChart, type ScatterChart } from "../../../apps/admin/lib/template-relationship-scatter";
import { correlation } from "./analysis-frame-core.mjs";

const MIN_POPULATION = 30_000;

interface FrameRow {
  code: string;
  name: string;
  shipment_2023: number;
  establishments_2024: number;
  employees_2024: number;
  daytime_2020: number;
  daytimeRatio_2020: number;
}

const [framePath, outDir] = process.argv.slice(2);
if (!framePath || !outDir) {
  console.error("引数: <frame.json> <出力先>");
  process.exit(2);
}
const rows: FrameRow[] = JSON.parse(readFileSync(framePath, "utf8")).rows;
const population = (r: FrameRow) => (r.daytime_2020 / r.daytimeRatio_2020) * 100;
const covariance = (a: number[], b: number[]) => {
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  return a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0) / (a.length - 1);
};

// 市区町村: 人口あたり出荷額 = 工場の密度 × 1 工場あたり出荷額 の恒等式で差を分解する
const towns = rows.filter((r) => r.shipment_2023 > 0 && r.establishments_2024 > 0 && population(r) >= MIN_POPULATION);
const perCapita = towns.map((r) => Math.log(r.shipment_2023 / population(r)));
const density = towns.map((r) => Math.log(r.establishments_2024 / population(r)));
const size = towns.map((r) => Math.log(r.shipment_2023 / r.establishments_2024));
const variance = covariance(perCapita, perCapita);
const share = { density: covariance(perCapita, density) / variance, size: covariance(perCapita, size) / variance };

// 県: 市区町村の表を足し上げる
const prefectures = new Map<string, { name: string; shipment: number; establishments: number; population: number }>();
for (const r of rows) {
  const code = r.code.slice(0, 2);
  const p = prefectures.get(code) ?? { name: r.name.split(" ")[0], shipment: 0, establishments: 0, population: 0 };
  p.shipment += r.shipment_2023;
  p.establishments += r.establishments_2024;
  p.population += population(r);
  prefectures.set(code, p);
}
const points = [...prefectures].map(([code, p]) => ({
  code,
  name: p.name,
  x: (p.establishments / p.population) * 1e4,
  y: p.shipment / p.establishments / 100,
}));
const r = correlation(points.map((p) => p.x), points.map((p) => p.y));
const pick = (sort: (a: (typeof points)[number], b: (typeof points)[number]) => number) => [...points].sort(sort)[0].name;
const labelNames = [pick((a, b) => b.y - a.y), "長野県"];

const chart: ScatterChart = {
  title: "工場の数と工場の大きさ",
  meta: "2023年 出荷額・2024年 事業所数",
  source: "社会・人口統計体系",
  xLabel: "製造業の事業所数（人口1万人あたり）",
  yLabel: "1事業所あたり出荷額（億円）",
  points,
  labelNames,
};
// 市区町村: 人口あたり出荷額で 4 等分し、下位の町を 1 としたときの中央値の倍率を比べる
const median = (values: number[]) => [...values].sort((x, y) => x - y)[Math.floor(values.length / 2)];
const ranked = [...towns].sort((a, b) => b.shipment_2023 / population(b) - a.shipment_2023 / population(a));
const quarters = [0, 1, 2, 3].map((i) => {
  const group = ranked.slice(Math.floor((i * ranked.length) / 4), Math.floor(((i + 1) * ranked.length) / 4));
  return {
    label: ["上位4分の1", "2番目", "3番目", "下位4分の1"][i],
    towns: group.length,
    density: median(group.map((t) => (t.establishments_2024 / population(t)) * 1e4)),
    size: median(group.map((t) => t.shipment_2023 / t.establishments_2024 / 100)),
  };
});
const base = quarters[3];
const quarterRows = quarters.map((q) => ({
  ...q,
  density: Number(q.density.toFixed(1)),
  size: Number(q.size.toFixed(1)),
  densityRatio: Number((q.density / base.density).toFixed(2)),
  sizeRatio: Number((q.size / base.size).toFixed(2)),
}));
const quarterChart: GroupedBarChart = {
  title: "強い町は数より大きさで差がつく",
  meta: `人口3万人以上の${towns.length}市区町村。下位4分の1を1とした倍率`,
  source: "社会・人口統計体系",
  groups: quarterRows.map((q) => q.label),
  series: [
    { label: "事業所の数", values: quarterRows.map((q) => q.densityRatio) },
    { label: "1事業所あたり出荷額", values: quarterRows.map((q) => q.sizeRatio) },
  ],
};
const svg = renderRelationshipScatterChart(chart);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "figure.svg"), svg);
writeFileSync(join(outDir, "figure-dark.svg"), renderRelationshipScatterChart(chart, CHART_THEMES.dark));
writeFileSync(join(outDir, "figure.json"), `${JSON.stringify(chart, null, 2)}\n`);
writeFileSync(join(outDir, "figure-quarters.svg"), renderGroupedBarsChart(quarterChart, CHART_THEMES.light));
writeFileSync(join(outDir, "figure-quarters-dark.svg"), renderGroupedBarsChart(quarterChart, CHART_THEMES.dark));
writeFileSync(join(outDir, "figure-quarters.json"), `${JSON.stringify(quarterChart, null, 2)}\n`);
main();

async function main() {
  await sharp(Buffer.from(svg), { limitInputPixels: 40_000_000 }).png().toFile(join(outDir, "figure.png"));
  await sharp(Buffer.from(renderGroupedBarsChart(quarterChart, CHART_THEMES.light)), { limitInputPixels: 40_000_000 }).png().toFile(join(outDir, "figure-quarters.png"));
  const result = {
    towns: towns.length,
    shareDensity: Number(share.density.toFixed(3)),
    shareSize: Number(share.size.toFixed(3)),
    prefectureCorrelation: r === null ? null : Number(r.toFixed(2)),
    topBySize: [...points].sort((a, b) => b.y - a.y).slice(0, 3).map((p) => `${p.name} ${p.y.toFixed(1)} 億円`),
    quarters: quarterRows,
    sizeEmployeeCorrelation: Number((correlation(towns.map((t) => Math.log(t.shipment_2023 / t.establishments_2024)), towns.map((t) => Math.log(t.employees_2024 / t.establishments_2024))) ?? 0).toFixed(2)),
    topByDensity: [...points].sort((a, b) => b.x - a.x).slice(0, 3).map((p) => `${p.name} ${p.x.toFixed(1)} 所`),
  };
  writeFileSync(join(outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}
