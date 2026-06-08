#!/usr/bin/env node
/**
 * generate-article-charts.mjs
 *
 * docs/21_ブログ記事原稿/<slug>/data/*.json を読み、SVG チャートを生成する固定 CLI スクリプト。
 *
 * Usage:
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug>            # 生成 + placeholder 置換
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --dry-run  # JSON syntax 検証のみ
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --validate # SVG 品質検証 (CI 用)
 *
 * --validate の検査内容:
 *   data/*.svg と article.md インライン <svg> の両方を対象に、
 *   - ERROR (CI fail): 構造不正 (viewBox/width/height/閉じタグ欠落)
 *   - WARN  (可視化のみ): dark mode 非対応 (@media prefers-color-scheme:dark 欠落) /
 *     theme 依存色の inline 直書き (svg-* class にすべき)
 *   → 品質統一の決定的ゲート。判断は不要 (コードで一律検査)。
 *
 * チャート種別 (ファイル名パターン):
 *   *-prefecture-rankings.json → bar chart (上位 5 + 下位 5)   [実装済み]
 *   *-tile-grid.json           → tile-grid-map (都道府県地図)    [実装済み]
 *   *-timeseries.json          → line chart (時系列・多系列対応)  [実装済み]
 *   *-scatter.json             → scatter chart (group色分け対応)  [実装済み]
 *   *-stacked.json             → stacked-bar                     [TODO]
 *   *-findings.json            → summary-findings table          [TODO]
 *
 * 関連:
 *   - SKILL.md: .claude/skills/blog/generate-article-charts/SKILL.md (chart 種別仕様の詳細)
 *   - workflow: .github/workflows/generate-article-charts.yml (PR で --validate 自動実行)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { lintSvgContent, extractInlineSvgs } from "../lib/svg-lint.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ---------- CLI 引数 ----------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SLUG = getArg("--slug");
const DRY_RUN = args.includes("--dry-run");
const VALIDATE = args.includes("--validate");
const EXTRACT_INLINE = args.includes("--extract-inline");
// --base: 記事ルート (slug の親)。デフォルトは docs draft。公開済記事の chart 再生成は
//          `--base .local/r2/app/blog` で R2 data を直接対象にできる (Phase 7 で追加)。
const BASE = getArg("--base") || "docs/21_ブログ記事原稿";

if (!SLUG) {
  console.error("Usage: --slug <slug> [--base <dir>] [--dry-run|--validate]");
  process.exit(1);
}

const ARTICLE_DIR = path.join(PROJECT_ROOT, BASE, SLUG);
const DATA_DIR = path.join(ARTICLE_DIR, "data");
const ARTICLE_MD = path.join(ARTICLE_DIR, "article.md");

if (!fs.existsSync(ARTICLE_DIR)) {
  console.error(`[error] Article dir not found: ${ARTICLE_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(DATA_DIR)) {
  // --validate は data/ が無くても article.md のインライン SVG を検査するため継続。
  // それ以外（生成・dry-run）は data/ が無ければ no-op。
  if (!VALIDATE) {
    console.warn(`[warn] Data dir not found: ${DATA_DIR}`);
    console.warn(`[warn] Nothing to process. Exiting 0 (no data dir is a no-op).`);
    process.exit(0);
  }
}

// ---------- helpers ----------
const log = (msg) => console.log(msg);
const warn = (msg) => console.warn(`[warn] ${msg}`);
const err = (msg) => console.error(`[error] ${msg}`);

function detectChartType(filename) {
  if (filename.endsWith("-prefecture-rankings.json")) return "bar";
  if (filename.endsWith("-tile-grid.json")) return "tile-grid";
  if (filename.endsWith("-timeseries.json")) return "line";
  if (filename.endsWith("-scatter.json")) return "scatter";
  if (filename.endsWith("-stacked.json")) return "stacked-bar";
  if (filename.endsWith("-findings.json")) return "summary";
  return null;
}

// ---------- bar chart 生成 ----------
// 入力 JSON 想定形式: [{ pref: "東京都", value: 123 }, ...]  or  { data: [{...}], title, subtitle, unit }
function genBarChartSvg(data, meta = {}) {
  const items = Array.isArray(data) ? data : data.data || [];
  if (!items.length) {
    return `<!-- empty data -->`;
  }
  const title = meta.title || data.title || "都道府県別ランキング";
  const subtitle = meta.subtitle || data.subtitle || "";
  const unit = meta.unit || data.unit || "";

  // 標準: 上位5 + 下位5 (2026-06-02 確定。上下対称・モバイル可読性優先)
  const N = 5;
  const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const topRows = sorted.slice(0, N);
  const bottomRows = sorted.slice(-N).reverse();

  const W = 680;
  const padTop = 60;
  const padBottom = 60;
  const rowH = 36;
  const H = padTop + padBottom + N * rowH;
  const padLeft = 90;
  const colW = (W - padLeft - 40) / 2; // 2 columns (top/bottom)
  const maxValue = Math.max(...items.map((d) => d.value ?? 0), 1);

  const blueScale = ["#1565c0", "#1976d2", "#1e88e5", "#2196f3", "#42a5f5", "#64b5f6", "#90caf9"];
  const redScale = ["#c62828", "#d32f2f", "#e53935", "#ef5350", "#e57373", "#ef9a9a"];

  const drawRow = (item, i, xOffset, palette) => {
    const y = padTop + i * rowH;
    const barLen = ((item.value ?? 0) / maxValue) * (colW - 80);
    const color = palette[i % palette.length];
    const pref = item.pref || item.label || "";
    const value = item.value ?? 0;
    return `
      <text x="${xOffset - 6}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="11" class="svg-label">${pref}</text>
      <rect x="${xOffset}" y="${y + 3}" width="${Math.max(barLen, 1)}" height="${rowH - 6}" fill="${color}" rx="2"/>
      <text x="${xOffset + Math.max(barLen, 1) + 4}" y="${y + rowH / 2 + 4}" font-size="10" class="svg-label">${value}${unit}</text>
    `;
  };

  const topCol = topRows.map((it, i) => drawRow(it, i, padLeft, blueScale)).join("");
  const bottomCol = bottomRows
    .map((it, i) => drawRow(it, i, padLeft + colW + 40, redScale))
    .join("");

  // dark mode 対応 (svg-lint WARN 回避): 背景・文字・凡例は svg-* class にし、
  // @media (prefers-color-scheme:dark) で色を反転。データ色 (青/赤の棒・列見出し) は
  // vivid で light/dark 両対応なので inline のまま (THEME_DEPENDENT_COLORS 対象外)。
  const style = `<style>
    .svg-bg{fill:#fafafa}
    .svg-title{fill:#222}
    .svg-subtitle{fill:#666}
    .svg-label{fill:#333}
    .svg-legend{fill:#888}
    @media (prefers-color-scheme:dark){
      .svg-bg{fill:#1f2937}
      .svg-title{fill:#f9fafb}
      .svg-subtitle{fill:#9ca3af}
      .svg-label{fill:#e5e7eb}
      .svg-legend{fill:#9ca3af}
    }
  </style>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="${title}">
  ${style}
  <rect width="${W}" height="${H}" class="svg-bg" rx="8"/>
  <text x="${W / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">${title}</text>
  ${subtitle ? `<text x="${W / 2}" y="42" text-anchor="middle" font-size="11" class="svg-subtitle">${subtitle}</text>` : ""}
  <text x="${padLeft + colW / 2}" y="${padTop - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#1565c0">上位 5</text>
  <text x="${padLeft + colW + 40 + colW / 2}" y="${padTop - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#c62828">下位 5</text>
  ${topCol}
  ${bottomCol}
  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-size="10" class="svg-legend">凡例: 青系=上位 / 赤系=下位</text>
</svg>`;
  return svg;
}

// ---------- tile-grid map 生成 (都道府県地図) ----------
// 入力 JSON 想定形式: [{ pref: "宮崎県", value: 123, unit: "ml" }, ...] or { data: [...], title, unit }
// 47 県を日本列島に模したグリッドへ配置し、value で choropleth (青のシーケンシャル) 着色する。
// 配置データは packages/visualization/src/d3/constants/tile-grid-layout.ts と同一 (自己完結のため埋込)。
const TILE_GRID_LAYOUT = [
  { name: "北海道", x: 12, y: 0, w: 2, h: 2 },
  { name: "青森", x: 12, y: 3, w: 2, h: 1 }, { name: "岩手", x: 13, y: 4 }, { name: "秋田", x: 12, y: 4 },
  { name: "宮城", x: 13, y: 5 }, { name: "山形", x: 12, y: 5 }, { name: "福島", x: 12, y: 6, w: 2, h: 1 },
  { name: "新潟", x: 10, y: 6, w: 2, h: 1 }, { name: "富山", x: 9, y: 6 }, { name: "石川", x: 8, y: 6 },
  { name: "福井", x: 8, y: 7 }, { name: "岐阜", x: 9, y: 7, w: 1, h: 2 }, { name: "長野", x: 10, y: 7, w: 1, h: 2 },
  { name: "群馬", x: 11, y: 7 }, { name: "栃木", x: 12, y: 7 }, { name: "茨城", x: 13, y: 7 },
  { name: "山梨", x: 11, y: 8 }, { name: "埼玉", x: 12, y: 8 }, { name: "千葉", x: 13, y: 8, w: 1, h: 2 },
  { name: "東京", x: 12, y: 9 }, { name: "神奈川", x: 12, y: 10 }, { name: "静岡", x: 10, y: 9, w: 2, h: 1 },
  { name: "愛知", x: 9, y: 9 }, { name: "滋賀", x: 8, y: 8 }, { name: "三重", x: 8, y: 9, w: 1, h: 2 },
  { name: "京都", x: 6, y: 8, w: 2, h: 1 }, { name: "兵庫", x: 5, y: 8, w: 1, h: 2 }, { name: "大阪", x: 6, y: 9 },
  { name: "奈良", x: 7, y: 9 }, { name: "和歌山", x: 6, y: 10, w: 2, h: 1 }, { name: "鳥取", x: 4, y: 8 },
  { name: "岡山", x: 4, y: 9 }, { name: "島根", x: 3, y: 8 }, { name: "広島", x: 3, y: 9 },
  { name: "山口", x: 2, y: 8, w: 1, h: 2 }, { name: "愛媛", x: 3, y: 11 }, { name: "香川", x: 4, y: 11 },
  { name: "高知", x: 3, y: 12 }, { name: "徳島", x: 4, y: 12 }, { name: "福岡", x: 1, y: 10 },
  { name: "佐賀", x: 0, y: 10 }, { name: "大分", x: 1, y: 11 }, { name: "長崎", x: 0, y: 11 },
  { name: "宮崎", x: 1, y: 12 }, { name: "熊本", x: 0, y: 12 }, { name: "鹿児島", x: 0, y: 13, w: 2, h: 1 },
  { name: "沖縄", x: 0, y: 15 },
];
// 都/道/府/県 を落として配置データと突合 (記事 data は "宮崎県"、配置は "宮崎")。
const normPref = (s) => String(s || "").replace(/[都道府県]$/, "").replace(/^北海$/, "北海道").trim();

function genTileGridMapSvg(data, meta = {}) {
  const items = Array.isArray(data) ? data : data.data || [];
  if (!items.length) return `<!-- empty data -->`;
  const title = meta.title || data.title || "都道府県マップ";
  const unit = meta.unit || data.unit || "";
  const valByPref = new Map();
  for (const it of items) {
    const key = normPref(it.pref || it.areaName || it.label || it.name);
    if (key) valByPref.set(key, it.value ?? null);
  }
  const vals = [...valByPref.values()].filter((v) => typeof v === "number");
  const minV = Math.min(...vals, 0);
  const maxV = Math.max(...vals, 1);
  // 9 段シーケンシャル (薄→濃)。light/dark 両対応の vivid 青系。
  const scale = ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"];
  const colorFor = (v) => {
    if (typeof v !== "number") return "#e5e7eb"; // データ無し (灰)
    const t = maxV === minV ? 0.5 : (v - minV) / (maxV - minV);
    return scale[Math.min(scale.length - 1, Math.max(0, Math.round(t * (scale.length - 1))))];
  };
  const textOn = (v) => {
    if (typeof v !== "number") return "#9ca3af";
    const t = maxV === minV ? 0.5 : (v - minV) / (maxV - minV);
    return t > 0.55 ? "#ffffff" : "#1f2937"; // 濃色タイルは白文字
  };

  const cell = 40;
  const gap = 3;
  const cols = 14; // x: 0..13
  const rows = 16; // y: 0..15
  const padTop = 56;
  const padBottom = 60;
  const padX = 16;
  const W = cols * (cell + gap) + padX * 2;
  const H = padTop + rows * (cell + gap) + padBottom;

  const tiles = TILE_GRID_LAYOUT.map((c) => {
    const w = (c.w || 1) * cell + ((c.w || 1) - 1) * gap;
    const h = (c.h || 1) * cell + ((c.h || 1) - 1) * gap;
    const px = padX + c.x * (cell + gap);
    const py = padTop + c.y * (cell + gap);
    const v = valByPref.has(c.name) ? valByPref.get(c.name) : null;
    const fill = colorFor(v);
    const tcol = textOn(v);
    const valLabel = typeof v === "number" ? `${v}` : "—";
    return `
      <rect x="${px}" y="${py}" width="${w}" height="${h}" fill="${fill}" stroke="#ffffff" stroke-width="1.5" rx="3"/>
      <text x="${px + w / 2}" y="${py + h / 2 - 2}" text-anchor="middle" font-size="10" font-weight="bold" fill="${tcol}">${c.name}</text>
      <text x="${px + w / 2}" y="${py + h / 2 + 11}" text-anchor="middle" font-size="8" fill="${tcol}">${valLabel}</text>`;
  }).join("");

  // 凡例 (薄→濃 グラデバー)
  const legW = 200;
  const legX = (W - legW) / 2;
  const legY = H - 38;
  const legStops = scale
    .map((c, i) => `<rect x="${legX + (i * legW) / scale.length}" y="${legY}" width="${legW / scale.length}" height="12" fill="${c}"/>`)
    .join("");

  const style = `<style>
    .svg-bg{fill:#fafafa}
    .svg-title{fill:#222}
    .svg-legend{fill:#888}
    @media (prefers-color-scheme:dark){
      .svg-bg{fill:#1f2937}
      .svg-title{fill:#f9fafb}
      .svg-legend{fill:#9ca3af}
    }
  </style>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="${title}">
  ${style}
  <rect width="${W}" height="${H}" class="svg-bg" rx="8"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">${title}</text>
  ${unit ? `<text x="${W / 2}" y="46" text-anchor="middle" font-size="11" class="svg-legend">単位: ${unit}（薄い＝小 / 濃い＝大）</text>` : ""}
  ${tiles}
  ${legStops}
  <text x="${legX - 6}" y="${legY + 10}" text-anchor="end" font-size="9" class="svg-legend">${minV}</text>
  <text x="${legX + legW + 6}" y="${legY + 10}" text-anchor="start" font-size="9" class="svg-legend">${maxV}</text>
</svg>`;
}

// ---------- line (時系列) 生成 ----------
// 入力 JSON: { title, unit, xLabel?, series:[{label, color?, data:[{year,value}]}] }
//   単系列省略形: { title, unit, data:[{year,value}] } も可。
const SERIES_COLORS = ["#1565c0", "#c62828", "#2e7d32", "#6a1b9a", "#ef6c00", "#00838f"];
function svgStyleBlock() {
  return `<style>
    .svg-bg{fill:#fafafa}
    .svg-title{fill:#222}
    .svg-subtitle{fill:#666}
    .svg-label{fill:#333}
    .svg-axis{stroke:#9ca3af}
    .svg-grid{stroke:#e5e7eb}
    .svg-tick{fill:#666}
    .svg-legend{fill:#888}
    @media (prefers-color-scheme:dark){
      .svg-bg{fill:#1f2937}
      .svg-title{fill:#f9fafb}
      .svg-subtitle{fill:#9ca3af}
      .svg-label{fill:#e5e7eb}
      .svg-axis{stroke:#6b7280}
      .svg-grid{stroke:#374151}
      .svg-tick{fill:#9ca3af}
      .svg-legend{fill:#9ca3af}
    }
  </style>`;
}
function niceTicks(min, max, count = 4) {
  if (min === max) return [min];
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round((min + step * i) * 100) / 100);
}
function genLineChartSvg(data, meta = {}) {
  const title = meta.title || data.title || "推移";
  const unit = meta.unit || data.unit || "";
  let series = data.series;
  if (!series && Array.isArray(data.data)) series = [{ label: data.label || "", data: data.data }];
  if (!series && Array.isArray(data)) series = [{ label: "", data }];
  series = (series || []).filter((s) => Array.isArray(s.data) && s.data.length);
  if (!series.length) return `<!-- empty data -->`;

  const allYears = [...new Set(series.flatMap((s) => s.data.map((d) => Number(d.year))))].sort((a, b) => a - b);
  const allVals = series.flatMap((s) => s.data.map((d) => Number(d.value)));
  const xMin = allYears[0];
  const xMax = allYears[allYears.length - 1];
  let yMin = Math.min(...allVals);
  let yMax = Math.max(...allVals);
  const pad = (yMax - yMin) * 0.08 || Math.abs(yMax) * 0.08 || 1;
  yMin -= pad;
  yMax += pad;

  const W = 680;
  const multi = series.length > 1;
  const H = 380 + (multi ? 24 : 0);
  const ml = 64, mr = 24, mt = 50, mb = 56;
  const pw = W - ml - mr;
  const ph = H - mt - mb - (multi ? 24 : 0);
  const xOf = (y) => ml + (xMax === xMin ? pw / 2 : ((y - xMin) / (xMax - xMin)) * pw);
  const yOf = (v) => mt + ph - ((v - yMin) / (yMax - yMin)) * ph;

  const yTicks = niceTicks(yMin + pad, yMax - pad, 4);
  const grid = yTicks
    .map((t) => `<line x1="${ml}" y1="${yOf(t).toFixed(1)}" x2="${ml + pw}" y2="${yOf(t).toFixed(1)}" class="svg-grid" stroke-width="0.5"/>
    <text x="${ml - 8}" y="${(yOf(t) + 4).toFixed(1)}" text-anchor="end" font-size="10" class="svg-tick">${t}</text>`)
    .join("");

  // X 軸ラベル (最大 7 個 + 最後に 年)。間引く。
  const xStep = Math.max(1, Math.ceil(allYears.length / 7));
  const xLabels = allYears
    .filter((_, i) => i % xStep === 0 || i === allYears.length - 1)
    .map((yr, idx, arr) => {
      const isLast = idx === arr.length - 1;
      return `<text x="${xOf(yr).toFixed(1)}" y="${mt + ph + 18}" text-anchor="middle" font-size="10" class="svg-tick">${yr}${isLast ? "年" : ""}</text>`;
    })
    .join("");

  const lines = series
    .map((s, i) => {
      const color = s.color || SERIES_COLORS[i % SERIES_COLORS.length];
      const pts = s.data
        .slice()
        .sort((a, b) => a.year - b.year)
        .map((d) => `${xOf(Number(d.year)).toFixed(1)},${yOf(Number(d.value)).toFixed(1)}`)
        .join(" ");
      const sorted = s.data.slice().sort((a, b) => a.year - b.year);
      const ends = [sorted[0], sorted[sorted.length - 1]]
        .map((d) => `<circle cx="${xOf(Number(d.year)).toFixed(1)}" cy="${yOf(Number(d.value)).toFixed(1)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`)
        .join("");
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>${ends}`;
    })
    .join("");

  let legend = "";
  if (multi) {
    const ly = H - 16;
    const itemW = 110;
    const totalW = series.length * itemW;
    let sx = (W - totalW) / 2;
    legend = series
      .map((s, i) => {
        const color = s.color || SERIES_COLORS[i % SERIES_COLORS.length];
        const x = sx + i * itemW;
        return `<line x1="${x}" y1="${ly}" x2="${x + 20}" y2="${ly}" stroke="${color}" stroke-width="2.5"/><text x="${x + 24}" y="${ly + 4}" font-size="11" class="svg-legend">${s.label || "系列" + (i + 1)}</text>`;
      })
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="${title}">
  ${svgStyleBlock()}
  <rect width="${W}" height="${H}" class="svg-bg" rx="8"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">${title}</text>
  ${unit ? `<text x="${ml}" y="${mt - 8}" font-size="10" class="svg-subtitle">単位: ${unit}</text>` : ""}
  <rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" class="svg-bg" stroke="#d1d5db" stroke-width="0.5"/>
  ${grid}
  ${xLabels}
  ${lines}
  ${legend}
</svg>`;
}

// ---------- scatter (散布図) 生成 ----------
// 入力 JSON: { title, xLabel, yLabel, xUnit?, yUnit?, points:[{label, x, y, group?}] }
//   points の別名 data も可。group があれば地方ブロック等で色分け + 凡例。
function genScatterChartSvg(data, meta = {}) {
  const title = meta.title || data.title || "散布図";
  const xLabel = data.xLabel || meta.xLabel || "X";
  const yLabel = data.yLabel || meta.yLabel || "Y";
  const points = (data.points || data.data || []).filter((p) => typeof p.x === "number" && typeof p.y === "number");
  if (!points.length) return `<!-- empty data -->`;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  const px = (xMax - xMin) * 0.08 || 1;
  const py = (yMax - yMin) * 0.08 || 1;
  xMin -= px; xMax += px; yMin -= py; yMax += py;

  const groups = [...new Set(points.map((p) => p.group).filter(Boolean))];
  const multi = groups.length > 0;
  const colorOf = (p) => (p.group ? SERIES_COLORS[groups.indexOf(p.group) % SERIES_COLORS.length] : "#1976d2");

  const W = 680;
  const legendRows = multi ? Math.ceil(groups.length / 3) : 0;
  const H = 420 + legendRows * 18;
  const ml = 64, mr = 24, mt = 50, mb = 56 + legendRows * 18;
  const pw = W - ml - mr;
  const ph = H - mt - mb;
  const xOf = (v) => ml + ((v - xMin) / (xMax - xMin)) * pw;
  const yOf = (v) => mt + ph - ((v - yMin) / (yMax - yMin)) * ph;

  const xTicks = niceTicks(xMin + px, xMax - px, 4);
  const yTicks = niceTicks(yMin + py, yMax - py, 4);
  const grid =
    yTicks
      .map((t) => `<line x1="${ml}" y1="${yOf(t).toFixed(1)}" x2="${ml + pw}" y2="${yOf(t).toFixed(1)}" class="svg-grid" stroke-width="0.5"/><text x="${ml - 8}" y="${(yOf(t) + 4).toFixed(1)}" text-anchor="end" font-size="10" class="svg-tick">${t}</text>`)
      .join("") +
    xTicks
      .map((t) => `<text x="${xOf(t).toFixed(1)}" y="${mt + ph + 18}" text-anchor="middle" font-size="10" class="svg-tick">${t}</text>`)
      .join("");

  // 点ラベルは混雑回避のため点数 <=20 のときのみ表示
  const showLabels = points.length <= 20;
  const dots = points
    .map((p) => {
      const cx = xOf(p.x).toFixed(1);
      const cy = yOf(p.y).toFixed(1);
      const lbl = showLabels && p.label ? `<text x="${(+cx + 6).toFixed(1)}" y="${(+cy + 3).toFixed(1)}" font-size="9" class="svg-label">${p.label}</text>` : "";
      return `<circle cx="${cx}" cy="${cy}" r="4" fill="${colorOf(p)}" fill-opacity="0.8" stroke="#fff" stroke-width="0.8"/>${lbl}`;
    })
    .join("");

  let legend = "";
  if (multi) {
    const baseY = H - legendRows * 18 - 2;
    legend = groups
      .map((g, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 80 + col * 180;
        const y = baseY + row * 18;
        return `<circle cx="${x}" cy="${y - 3}" r="4" fill="${SERIES_COLORS[i % SERIES_COLORS.length]}"/><text x="${x + 10}" y="${y}" font-size="10" class="svg-legend">${g}</text>`;
      })
      .join("");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="${title}">
  ${svgStyleBlock()}
  <rect width="${W}" height="${H}" class="svg-bg" rx="8"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">${title}</text>
  <rect x="${ml}" y="${mt}" width="${pw}" height="${ph}" class="svg-bg" stroke="#d1d5db" stroke-width="0.5"/>
  ${grid}
  ${dots}
  <text x="${ml + pw / 2}" y="${mt + ph + 40}" text-anchor="middle" font-size="11" class="svg-subtitle">${xLabel}${data.xUnit ? ` (${data.xUnit})` : ""}</text>
  <text x="16" y="${mt + ph / 2}" text-anchor="middle" font-size="11" class="svg-subtitle" transform="rotate(-90 16 ${mt + ph / 2})">${yLabel}${data.yUnit ? ` (${data.yUnit})` : ""}</text>
  ${legend}
</svg>`;
}

// TODO: 他チャート種別の実装 (stacked / summary)
function genStubSvg(chartType, name) {
  const W = 680;
  const H = 480;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f0f0f0" rx="8"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#666">TODO: ${chartType} chart not implemented (${name})</text>
</svg>`;
}

// ---------- SVG lint (共有ライブラリ) ----------
// lint ロジックは .claude/scripts/lib/svg-lint.mjs に集約 (audit-chart-quality.mjs と共有)。

/** ファイルパスから SVG を読んで lint する */
function validateSvg(svgPath) {
  if (!fs.existsSync(svgPath)) return { errors: ["file not found"], warnings: [] };
  const content = fs.readFileSync(svgPath, "utf8");
  return lintSvgContent(content);
}

/** article.md からインライン <svg> を抽出する (ファイルパス版) */
function extractInlineSvgsFromFile(mdPath) {
  if (!fs.existsSync(mdPath)) return [];
  return extractInlineSvgs(fs.readFileSync(mdPath, "utf8"));
}

// ---------- placeholder 置換 ----------
function replacePlaceholders(chartNames) {
  if (!fs.existsSync(ARTICLE_MD)) {
    warn(`article.md not found at ${ARTICLE_MD}, skipping placeholder replacement`);
    return 0;
  }
  let md = fs.readFileSync(ARTICLE_MD, "utf8");
  let replaced = 0;
  for (const name of chartNames) {
    // 形式1: コメント `<!-- chart:NAME -->`
    const comment = new RegExp(`<!--\\s*chart:${name}\\s*-->`, "g");
    if (comment.test(md)) {
      md = md.replace(comment, `![チャート](data/${name}.svg)`);
      replaced++;
    }
    // 形式2: タグ `<chart-placeholder ... data="NAME" ... />` (実記事 54 本がこの形式)
    // caption 属性があれば alt に流用する。
    const tag = new RegExp(`<chart-placeholder[^>]*\\bdata="${name}"[^>]*/?>(?:\\s*</chart-placeholder>)?`, "g");
    if (tag.test(md)) {
      md = md.replace(tag, (m) => {
        const cap = m.match(/caption="([^"]*)"/);
        return `![${cap ? cap[1] : "チャート"}](data/${name}.svg)`;
      });
      replaced++;
    }
  }
  // フォールバック: placeholder の data 属性が生成チャート名と一致しないケース
  // (著者命名 "…-top10" ≠ ranking key "…-prefecture-rankings"。pilot で 54 本中多数が該当)。
  // ランキングチャートが 1 つだけなら、残った <chart-placeholder> をそれで置換する。
  const rankingCharts = chartNames.filter((n) => n.endsWith("-prefecture-rankings"));
  if (rankingCharts.length === 1 && /<chart-placeholder/.test(md)) {
    const name = rankingCharts[0];
    md = md.replace(/<chart-placeholder[^>]*\/?>(?:\s*<\/chart-placeholder>)?/g, (m) => {
      const cap = m.match(/caption="([^"]*)"/);
      replaced++;
      return `![${cap ? cap[1] : "チャート"}](data/${name}.svg)`;
    });
  }
  if (replaced > 0) {
    fs.writeFileSync(ARTICLE_MD, md, "utf8");
  }
  return replaced;
}

// ---------- インライン <svg> のファイル抽出 ----------
// 生成器が未対応のチャート種別 (scatter/timeseries 等) の inline <svg> を data/*.svg に
// 切り出し、![](data/…) 参照へ置換する。pilot (fertility 散布図) で実証。--extract-inline で起動。
function extractInlineSvgsToFiles() {
  if (!fs.existsSync(ARTICLE_MD)) return 0;
  let md = fs.readFileSync(ARTICLE_MD, "utf8");
  const blocks = md.match(/<svg[\s\S]*?<\/svg>/g) || [];
  if (!blocks.length) return 0;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  let n = 0;
  for (const block of blocks) {
    n++;
    const name = `inline-chart-${n}`;
    const aria = block.match(/aria-label="([^"]*)"/);
    fs.writeFileSync(path.join(DATA_DIR, `${name}.svg`), block, "utf8");
    md = md.replace(block, `![${aria ? aria[1] : "チャート"}](data/${name}.svg)`);
  }
  fs.writeFileSync(ARTICLE_MD, md, "utf8");
  return n;
}

// ---------- main ----------
// validate 時は data/ 不在を許容（article.md インライン SVG 検査のため）。
const jsonFiles = fs.existsSync(DATA_DIR)
  ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

if (jsonFiles.length === 0) {
  warn(`No JSON files found in ${DATA_DIR}`);
}

log(`[info] slug=${SLUG} mode=${EXTRACT_INLINE ? "extract-inline" : VALIDATE ? "validate" : DRY_RUN ? "dry-run" : "generate"}`);

// --extract-inline: インライン <svg> をファイル化して終了 (JSON 不要)
if (EXTRACT_INLINE) {
  const n = extractInlineSvgsToFiles();
  log(`[done] extract-inline: ${n} inline <svg> → data/inline-chart-*.svg`);
  process.exit(0);
}

log(`[info] Found ${jsonFiles.length} JSON file(s) in data/`);

// Phase 1: JSON syntax check (always)
let jsonOkCount = 0;
let jsonNgCount = 0;
const jsonMeta = [];
for (const f of jsonFiles) {
  const fp = path.join(DATA_DIR, f);
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, "utf8"));
    const type = detectChartType(f);
    jsonMeta.push({ file: f, type, parsed });
    jsonOkCount++;
    log(`  [ok ] ${f}  type=${type || "unknown"}`);
  } catch (e) {
    jsonNgCount++;
    err(`  [ng ] ${f}  ${e.message}`);
  }
}

if (jsonNgCount > 0) {
  err(`JSON syntax check failed: ${jsonNgCount} file(s) invalid`);
  process.exit(2);
}

// --dry-run: stop here
if (DRY_RUN) {
  log(`[done] dry-run: ${jsonOkCount} JSON file(s) valid`);
  process.exit(0);
}

// --validate: 構造 (ERROR) + dark mode/パレット (WARN) を data/*.svg と
// article.md インライン SVG の両方で検査する。
if (VALIDATE) {
  let errorCount = 0;
  let warnCount = 0;
  let targetCount = 0;

  const report = (label, { errors, warnings }) => {
    targetCount++;
    if (errors.length === 0 && warnings.length === 0) {
      log(`  [ok  ] ${label}`);
      return;
    }
    for (const e of errors) {
      errorCount++;
      err(`  [err ] ${label}  ${e}`);
    }
    for (const w of warnings) {
      warnCount++;
      warn(`  [warn] ${label}  ${w}`);
    }
  };

  // 1. data/*.svg (生成物)
  const svgFiles = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".svg"))
    : [];
  log(`[info] data/*.svg: ${svgFiles.length} file(s)`);
  for (const f of svgFiles) {
    report(`data/${f}`, validateSvg(path.join(DATA_DIR, f)));
  }

  // 2. article.md インライン <svg> (手書き — 品質バラつきの主因)
  const inlineSvgs = extractInlineSvgsFromFile(ARTICLE_MD);
  log(`[info] article.md inline <svg>: ${inlineSvgs.length} block(s)`);
  inlineSvgs.forEach((svg, i) => {
    report(`article.md inline-svg #${i + 1}`, lintSvgContent(svg));
  });

  if (targetCount === 0) {
    warn("検査対象の SVG なし (data/*.svg もインライン SVG も無い)");
    log(`[done] validate: 0 svg, JSON ok=${jsonOkCount}`);
    process.exit(0);
  }

  log(
    `[done] validate: ${targetCount} target(s), errors=${errorCount}, warnings=${warnCount}`,
  );
  if (warnCount > 0) {
    warn(
      "WARN は描画は壊れないが品質基準未達 (dark mode 非対応 / theme 色 inline)。" +
        " svg-builder 経由で再生成すると解消する。",
    );
  }
  // ERROR のみ CI を fail させる (WARN は可視化のみ、既存資産を壊さない)
  if (errorCount > 0) {
    err(`SVG validation failed: ${errorCount} error(s)`);
    process.exit(3);
  }
  process.exit(0);
}

// Default mode: generate SVGs
const chartNames = [];
for (const { file, type, parsed } of jsonMeta) {
  const baseName = file.replace(/\.json$/, "");
  const svgPath = path.join(DATA_DIR, `${baseName}.svg`);
  let svg;
  if (type === "bar") {
    svg = genBarChartSvg(parsed);
  } else if (type === "tile-grid") {
    svg = genTileGridMapSvg(parsed);
  } else if (type === "line") {
    svg = genLineChartSvg(parsed);
  } else if (type === "scatter") {
    svg = genScatterChartSvg(parsed);
  } else if (type) {
    warn(`chart type "${type}" not implemented for ${file} — emitting stub SVG`);
    svg = genStubSvg(type, baseName);
  } else {
    warn(`unknown chart type for ${file} — skipping`);
    continue;
  }
  // 2026-05-25 追加: data-source provenance を SVG 冒頭に embed
  // factual cross-check (article-factual-check.mjs) が SVG 値の出所を trace するために使用。
  // agent 手書きの inline SVG (article.md 内) には provenance がないので、
  // chart 系のチェッカーは「provenance 付き SVG = generator 経由で data から作られた」と信頼可能。
  const provenance = `<!-- data-source: ${file} | generated: ${new Date().toISOString()} -->\n`;
  fs.writeFileSync(svgPath, provenance + svg, "utf8");
  chartNames.push(baseName);
  log(`  [gen] ${baseName}.svg  (${(svg.length / 1024).toFixed(1)} KB)`);
}

// Phase 3: placeholder replacement
const replaced = replacePlaceholders(chartNames);
log(`[info] Replaced ${replaced} placeholder(s) in article.md`);

log(`[done] generate: ${chartNames.length} SVG file(s) written`);
