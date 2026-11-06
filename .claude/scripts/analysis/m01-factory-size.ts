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

import { renderRelationshipScatterChart, type ScatterChart } from "../../../apps/admin/lib/template-relationship-scatter";
import { correlation } from "./analysis-frame-core.mjs";

const MIN_POPULATION = 30_000;

interface FrameRow {
  code: string;
  name: string;
  shipment_2023: number;
  establishments_2024: number;
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
const svg = renderRelationshipScatterChart(chart);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "figure.svg"), svg);
main();

async function main() {
  await sharp(Buffer.from(svg), { limitInputPixels: 40_000_000 }).png().toFile(join(outDir, "figure.png"));
  const result = {
    towns: towns.length,
    shareDensity: Number(share.density.toFixed(3)),
    shareSize: Number(share.size.toFixed(3)),
    prefectureCorrelation: r === null ? null : Number(r.toFixed(2)),
    topBySize: [...points].sort((a, b) => b.y - a.y).slice(0, 3).map((p) => `${p.name} ${p.y.toFixed(1)} 億円`),
    topByDensity: [...points].sort((a, b) => b.x - a.x).slice(0, 3).map((p) => `${p.name} ${p.x.toFixed(1)} 所`),
  };
  writeFileSync(join(outDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}
