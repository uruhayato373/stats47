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
// validate 時は data/ 不在を許容（article.md インライン SVG 検査のため）。
const jsonFiles = fs.existsSync(DATA_DIR)
  ? fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

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
