#!/usr/bin/env node
/**
 * generate-article-charts.mjs
 *
 * docs/21_ブログ記事原稿/<slug>/data/*.json を読み、SVG チャートを生成する固定 CLI スクリプト。
 *
 * Usage:
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug>            # 生成 + placeholder 置換
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --dry-run  # JSON syntax 検証のみ
 *   node .claude/scripts/blog/generate-article-charts.mjs --slug <slug> --validate # 生成済 SVG syntax 検証のみ (CI 用)
 *
 * チャート種別 (ファイル名パターン):
 *   *-prefecture-rankings.json → bar chart (上位 10 + 下位 10)   [実装済み]
 *   *-tile-grid.json           → tile-grid-map                   [TODO]
 *   *-timeseries.json          → line chart                      [TODO]
 *   *-scatter.json             → scatter chart                   [TODO]
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

if (!SLUG) {
  console.error("Usage: --slug <slug> [--dry-run|--validate]");
  process.exit(1);
}

const ARTICLE_DIR = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿", SLUG);
const DATA_DIR = path.join(ARTICLE_DIR, "data");
const ARTICLE_MD = path.join(ARTICLE_DIR, "article.md");

if (!fs.existsSync(ARTICLE_DIR)) {
  console.error(`[error] Article dir not found: ${ARTICLE_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(DATA_DIR)) {
  console.warn(`[warn] Data dir not found: ${DATA_DIR}`);
  console.warn(`[warn] Nothing to process. Exiting 0 (no data dir is a no-op).`);
  process.exit(0);
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

  // sort desc, take top 10 + bottom 10
  const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();

  const W = 680;
  const H = 480;
  const padTop = 60;
  const padBottom = 60;
  const padLeft = 90;
  const colW = (W - padLeft - 40) / 2; // 2 columns (top/bottom)
  const rowH = (H - padTop - padBottom) / 10;
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
      <text x="${xOffset - 6}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="11" fill="#333">${pref}</text>
      <rect x="${xOffset}" y="${y + 3}" width="${Math.max(barLen, 1)}" height="${rowH - 6}" fill="${color}" rx="2"/>
      <text x="${xOffset + Math.max(barLen, 1) + 4}" y="${y + rowH / 2 + 4}" font-size="10" fill="#333">${value}${unit}</text>
    `;
  };

  const topCol = top10.map((it, i) => drawRow(it, i, padLeft, blueScale)).join("");
  const bottomCol = bottom10
    .map((it, i) => drawRow(it, i, padLeft + colW + 40, redScale))
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="${title}">
  <rect width="${W}" height="${H}" fill="#fafafa" rx="8"/>
  <text x="${W / 2}" y="24" text-anchor="middle" font-size="16" font-weight="bold" fill="#222">${title}</text>
  ${subtitle ? `<text x="${W / 2}" y="42" text-anchor="middle" font-size="11" fill="#666">${subtitle}</text>` : ""}
  <text x="${padLeft + colW / 2}" y="${padTop - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#1565c0">上位 10</text>
  <text x="${padLeft + colW + 40 + colW / 2}" y="${padTop - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="#c62828">下位 10</text>
  ${topCol}
  ${bottomCol}
  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-size="10" fill="#888">凡例: 青系=上位 / 赤系=下位</text>
</svg>`;
  return svg;
}

// TODO: 他チャート種別の実装 (tile-grid / line / scatter / stacked / summary)
function genStubSvg(chartType, name) {
  const W = 680;
  const H = 480;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f0f0f0" rx="8"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#666">TODO: ${chartType} chart not implemented (${name})</text>
</svg>`;
}

// ---------- SVG syntax 検証 ----------
function validateSvg(svgPath) {
  if (!fs.existsSync(svgPath)) return { ok: false, reason: "file not found" };
  const content = fs.readFileSync(svgPath, "utf8").trim();
  if (!content.startsWith("<svg") && !content.startsWith("<?xml")) {
    return { ok: false, reason: "does not start with <svg or <?xml" };
  }
  if (!content.endsWith("</svg>")) {
    return { ok: false, reason: "does not end with </svg>" };
  }
  if (!/viewBox\s*=/.test(content)) {
    return { ok: false, reason: "missing viewBox attribute" };
  }
  if (!/width\s*=/.test(content) || !/height\s*=/.test(content)) {
    return { ok: false, reason: "missing width or height attribute" };
  }
  return { ok: true };
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
    const placeholder = new RegExp(`<!--\\s*chart:${name}\\s*-->`, "g");
    if (placeholder.test(md)) {
      md = md.replace(placeholder, `![チャート](data/${name}.svg)`);
      replaced++;
    }
  }
  if (replaced > 0) {
    fs.writeFileSync(ARTICLE_MD, md, "utf8");
  }
  return replaced;
}

// ---------- main ----------
const jsonFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (jsonFiles.length === 0) {
  warn(`No JSON files found in ${DATA_DIR}`);
}

log(`[info] slug=${SLUG} mode=${VALIDATE ? "validate" : DRY_RUN ? "dry-run" : "generate"}`);
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

// --validate: check existing SVG files
if (VALIDATE) {
  const svgFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".svg"));
  log(`[info] Found ${svgFiles.length} SVG file(s) to validate`);
  let svgOk = 0;
  let svgNg = 0;
  if (svgFiles.length === 0) {
    warn("no SVG files to validate (data/*.svg not generated yet)");
    log(`[done] validate: 0 svg, JSON ok=${jsonOkCount}`);
    process.exit(0);
  }
  for (const f of svgFiles) {
    const result = validateSvg(path.join(DATA_DIR, f));
    if (result.ok) {
      svgOk++;
      log(`  [ok ] ${f}`);
    } else {
      svgNg++;
      err(`  [ng ] ${f}  ${result.reason}`);
    }
  }
  if (svgNg > 0) {
    err(`SVG validation failed: ${svgNg} file(s) invalid`);
    process.exit(3);
  }
  log(`[done] validate: ${svgOk} SVG file(s) valid`);
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
  } else if (type) {
    warn(`chart type "${type}" not implemented for ${file} — emitting stub SVG`);
    svg = genStubSvg(type, baseName);
  } else {
    warn(`unknown chart type for ${file} — skipping`);
    continue;
  }
  fs.writeFileSync(svgPath, svg, "utf8");
  chartNames.push(baseName);
  log(`  [gen] ${baseName}.svg  (${(svg.length / 1024).toFixed(1)} KB)`);
}

// Phase 3: placeholder replacement
const replaced = replacePlaceholders(chartNames);
log(`[info] Replaced ${replaced} placeholder(s) in article.md`);

log(`[done] generate: ${chartNames.length} SVG file(s) written`);
