#!/usr/bin/env tsx
/**
 * cc-estat-04-aging-heatmap の図 2 枚 (aging-heatmap-oranges.svg / aging-heatmap-viridis.svg) を、
 * 記事の Step 3・Step 5 のコード (AgingHeatmap + HeatmapLegend) で描き直す。
 *
 * 手順解説記事のサンプルコードで描いた図は svg-builder の対象外なので、記事のコードをここに写して
 * renderToStaticMarkup で SVG にする (blog-svg-chart-standards.md §6-5)。入力は data JSON の値だけ。
 *
 * Usage:
 *   npx tsx .claude/scripts/blog/article-renderers/cc-estat-04-aging-heatmap/aging-heatmap.ts --scheme oranges
 *   npx tsx .claude/scripts/blog/article-renderers/cc-estat-04-aging-heatmap/aging-heatmap.ts --scheme viridis
 *   (--dir で記事ディレクトリを変える。既定は contents/blog/cc-estat-04-aging-heatmap)
 *
 * 記事のコードと違うのは、図のタイトル・配色名・出典の行を外側の SVG に添える部分だけ (本文の説明どおり)。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as d3 from "d3";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const SLUG = "cc-estat-04-aging-heatmap";

type Scheme = "oranges" | "plasma" | "viridis" | "ylorrd";
type Row = { areaCode: string; areaName: string; values: (number | null)[] };
type CellDatum = { areaCode: string; areaName: string; year: number; value: number | null };
type HeatmapJson = {
  label: string;
  years: number[];
  data: { areaCode: string; areaName: string; year: number; value: number | null }[];
};

// ---- 記事 Step 3 の AgingHeatmap (useMemo を外しただけで、描く要素と属性は記事のコードと同じ) ----

const INTERPOLATORS = {
  oranges: d3.interpolateOranges,
  plasma: d3.interpolatePlasma,
  viridis: d3.interpolateViridis,
  ylorrd: d3.interpolateYlOrRd,
};

function buildScale(data: Row[], years: number[], scheme: Scheme) {
  const cells: CellDatum[] = [];
  for (const row of data) {
    row.values.forEach((value, i) => {
      cells.push({ areaCode: row.areaCode, areaName: row.areaName, year: years[i], value });
    });
  }
  const arr = cells.flatMap((c) => (c.value == null ? [] : [c.value]));
  const vMin = d3.min(arr) ?? 0;
  const vMax = d3.max(arr) ?? 1;
  const color = d3.scaleSequential(INTERPOLATORS[scheme]).domain([vMin, vMax]);
  return { cells, vMin, vMax, color };
}

const CELL_W = 64;
const CELL_H = 18;
const PAD_L = 80;
const PAD_T = 32;

function heatmapSize(rows: number, cols: number) {
  return { width: PAD_L + CELL_W * cols + 24, height: PAD_T + CELL_H * rows + 8 };
}

function AgingHeatmapSvg(data: Row[], years: number[], scheme: Scheme, x: number, y: number) {
  const { cells, color } = buildScale(data, years, scheme);
  const { width, height } = heatmapSize(data.length, years.length);
  return h(
    "svg",
    { x, y, width, height, viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "47県×5時点の高齢化率ヒートマップ" },
    h(
      "defs",
      null,
      h(
        "pattern",
        { id: "missing-cell", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
        h("rect", { width: 6, height: 6, fill: "#f1f5f9" }),
        h("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "#94a3b8", strokeWidth: 2 }),
      ),
    ),
    h(
      "g",
      { transform: `translate(${PAD_L}, ${PAD_T - 8})` },
      years.map((yr, i) =>
        h("text", { key: yr, x: CELL_W * i + CELL_W / 2, y: 0, textAnchor: "middle", fontSize: 11 }, yr),
      ),
    ),
    h(
      "g",
      { transform: `translate(${PAD_L - 6}, ${PAD_T})` },
      data.map((row, i) =>
        h(
          "text",
          { key: row.areaCode, x: 0, y: CELL_H * i + CELL_H * 0.7, textAnchor: "end", fontSize: 10 },
          row.areaName,
        ),
      ),
    ),
    h(
      "g",
      { transform: `translate(${PAD_L}, ${PAD_T})` },
      cells.map((c) => {
        const rowIdx = data.findIndex((r) => r.areaCode === c.areaCode);
        const col = years.indexOf(c.year);
        return h(
          "rect",
          {
            key: `${c.areaCode}-${c.year}`,
            x: col * CELL_W,
            y: rowIdx * CELL_H,
            width: CELL_W - 1,
            height: CELL_H - 1,
            fill: c.value == null ? "url(#missing-cell)" : color(c.value),
          },
          h("title", null, `${c.areaName} ${c.year}: ${c.value == null ? "欠損" : `${c.value.toFixed(1)}%`}`),
        );
      }),
    ),
  );
}

// ---- 記事 Step 5 の HeatmapLegend ----

function HeatmapLegendSvg(data: Row[], years: number[], scheme: Scheme, x: number, y: number) {
  const { color, vMin, vMax } = buildScale(data, years, scheme);
  const width = 240;
  const height = 12;
  const stops = d3.range(11).map((i) => ({ offset: `${i * 10}%`, color: color(vMin + ((vMax - vMin) * i) / 10) }));
  return h(
    "svg",
    { x, y, width, height: height + 18, role: "img", "aria-label": "凡例" },
    h(
      "defs",
      null,
      h(
        "linearGradient",
        { id: "heatmap-legend" },
        stops.map((s, i) => h("stop", { key: i, offset: s.offset, stopColor: s.color })),
      ),
    ),
    h("rect", { x: 0, y: 0, width, height, fill: "url(#heatmap-legend)" }),
    h("text", { x: 0, y: height + 12, fontSize: 10, textAnchor: "start" }, `${vMin.toFixed(1)}%`),
    h("text", { x: width, y: height + 12, fontSize: 10, textAnchor: "end" }, `${vMax.toFixed(1)}%`),
  );
}

// ---- 図のタイトル・配色名・出典を添えた外側の SVG ----

const SCHEME_LABEL: Record<Scheme, string> = { oranges: "Oranges", plasma: "Plasma", viridis: "Viridis", ylorrd: "YlOrRd" };
const LEGEND_Y = 56;
const HEATMAP_Y = 96;
const FOOTER_H = 28;
const STYLE = `  <style>
    .svg-bg{fill:#ffffff}
    .svg-plot{fill:#f9fafb}
    .svg-plot-border{stroke:#d1d5db}
    .svg-title{fill:#1f2937}
    .svg-axis{fill:#374151}
    .svg-tick{fill:#6b7280}
    .svg-grid{stroke:#e5e7eb}
    text{fill:#374151}
    @media (prefers-color-scheme:dark){
    .svg-bg{fill:#0f172a}
    .svg-plot{fill:#1e293b}
    .svg-plot-border{stroke:#334155}
    .svg-title{fill:#e2e8f0}
    .svg-axis{fill:#cbd5e1}
    .svg-tick{fill:#94a3b8}
    .svg-grid{stroke:#334155}
    text{fill:#cbd5e1}
    }
  </style>`;

/** data JSON (47 県 × 年の縦持ち) を記事 Step 2 の matrix (areaCode 昇順の行・years 順の列) に並べる */
export function toMatrix(json: HeatmapJson): Row[] {
  const byCode = new Map<string, Row>();
  for (const d of json.data) {
    if (!byCode.has(d.areaCode)) {
      byCode.set(d.areaCode, { areaCode: d.areaCode, areaName: d.areaName, values: json.years.map(() => null) });
    }
    const col = json.years.indexOf(d.year);
    if (col >= 0) byCode.get(d.areaCode)!.values[col] = d.value;
  }
  return [...byCode.values()].sort((a, b) => a.areaCode.localeCompare(b.areaCode));
}

export function renderAgingHeatmap(json: HeatmapJson, scheme: Scheme, jsonName: string, generatedAt: string): string {
  const matrix = toMatrix(json);
  const { width, height } = heatmapSize(matrix.length, json.years.length);
  const outerH = HEATMAP_Y + height + FOOTER_H;
  const first = json.years[0];
  const last = json.years[json.years.length - 1];
  const inner = renderToStaticMarkup(
    h(
      Fragment,
      null,
      HeatmapLegendSvg(matrix, json.years, scheme, 16, LEGEND_Y),
      AgingHeatmapSvg(matrix, json.years, scheme, 0, HEATMAP_Y),
    ),
  );
  const legendEnd = inner.indexOf("</svg>") + "</svg>".length;
  return [
    `<!-- data-source: ${jsonName} | generated: ${generatedAt} -->`,
    `<svg width="${width}" height="${outerH}" viewBox="0 0 ${width} ${outerH}" xmlns="http://www.w3.org/2000/svg" font-family="'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif" role="img" aria-label="47都道府県の${json.label} ${first}〜${last}年のヒートマップ（配色 ${SCHEME_LABEL[scheme]}）">`,
    STYLE,
    `  <rect width="${width}" height="${outerH}" class="svg-bg"/>`,
    `  <text x="16" y="24" font-size="14" font-weight="bold" class="svg-title">${json.label} ${first}〜${last}年（47都道府県）</text>`,
    `  <text x="16" y="42" font-size="11" class="svg-tick">配色 ${SCHEME_LABEL[scheme]}</text>`,
    `  ${inner.slice(0, legendEnd)}`,
    `  ${inner.slice(legendEnd)}`,
    `  <text x="16" y="${outerH - 10}" font-size="10" class="svg-tick">出典: stats47.jp 高齢化率ランキング（社会・人口統計体系）</text>`,
    `</svg>`,
    "",
  ].join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scheme = arg("--scheme") as Scheme | undefined;
  if (!scheme || !(scheme in INTERPOLATORS)) {
    console.error("usage: aging-heatmap.ts --scheme oranges|viridis|plasma|ylorrd [--dir <article dir>]");
    process.exit(2);
  }
  const dir = path.resolve(arg("--dir") ?? path.join(PROJECT_ROOT, "contents/blog", SLUG));
  const base = `aging-heatmap-${scheme}`;
  const json = JSON.parse(fs.readFileSync(path.join(dir, "data", `${base}.json`), "utf8")) as HeatmapJson;
  const svg = renderAgingHeatmap(json, scheme, `${base}.json`, new Date().toISOString());
  fs.writeFileSync(path.join(dir, "data", `${base}.svg`), svg);
  console.log(`wrote ${path.join(dir, "data", `${base}.svg`)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
