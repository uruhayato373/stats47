#!/usr/bin/env node
/**
 * audit-chart-quality.mjs
 *
 * 全ブログ記事のチャート SVG 品質を一括監査する。
 * generate-article-charts.mjs の --validate を「全記事スケール」に拡張したもの。
 *
 * 検査対象 (記事ごと):
 *   - <base>/<slug>/data/*.svg      (生成物)
 *   - <base>/<slug>/article.md の インライン <svg>  (手書き — 品質バラつきの主因)
 *
 * lint は .claude/scripts/lib/svg-lint.mjs を共有 (CLAUDE.md 原則 5: 決定的判定はコード)。
 *
 * Usage:
 *   node .claude/scripts/blog/audit-chart-quality.mjs [--base <dir>] [--json] [--out <path>]
 *
 *   --base <dir>  記事ルート。デフォルト: .local/r2/app/blog (R2 pull 後のローカル)
 *                 docs ドラフト監査なら --base docs/21_ブログ記事原稿
 *   --json        機械可読 JSON を stdout に出力 (brushup 候補選定が読む)
 *   --out <path>  監査結果 JSON の保存先。デフォルト: .claude/state/blog/chart-audit.json
 *
 * 出力:
 *   - 人間向け: 優先度付きサマリ (どの記事のチャートを直すべきか)
 *   - 機械向け: chart-audit.json (slug → { errors, warnings, darkModeMissing, ... })
 *
 * 注意: 既存公開記事の data/*.json (元データ) は publish 後に削除されるため、
 *   本スクリプトは「検出」のみ。再生成は brushup サイクル (data 再取得) に委ねる。
 *   → select-brushup-candidates.mjs が本 JSON を読み chartQuality を加味する。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { lintSvgContent, extractInlineSvgs } from "../lib/svg-lint.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = path.resolve(PROJECT_ROOT, getArg("--base", ".local/r2/app/blog"));
const JSON_OUT = args.includes("--json");
const OUT_PATH = path.resolve(
  PROJECT_ROOT,
  getArg("--out", ".claude/state/blog/chart-audit.json"),
);

const log = (m) => !JSON_OUT && console.log(m);
const warn = (m) => !JSON_OUT && console.warn(m);

if (!fs.existsSync(BASE)) {
  console.error(`[error] base dir not found: ${BASE}`);
  console.error(
    `先に R2 を pull してください (例: /pull-r2 --prefix blog)。` +
      ` または --base docs/21_ブログ記事原稿 でドラフトを監査。`,
  );
  process.exit(1);
}

// ---------- 1 記事を監査 ----------
function auditArticle(slug) {
  const dir = path.join(BASE, slug);
  const dataDir = path.join(dir, "data");
  const articleMd = path.join(dir, "article.md");

  let errors = 0;
  let warnings = 0;
  let darkModeMissing = 0;
  let themeColorInline = 0;
  let svgCount = 0;
  const details = [];

  const consume = (label, { errors: errs, warnings: warns }) => {
    svgCount++;
    errors += errs.length;
    warnings += warns.length;
    for (const w of warns) {
      if (w.includes("dark mode 非対応")) darkModeMissing++;
      if (w.includes("theme 依存色")) themeColorInline++;
    }
    if (errs.length || warns.length) {
      details.push({ target: label, errors: errs, warnings: warns });
    }
  };

  // data/*.svg
  if (fs.existsSync(dataDir)) {
    for (const f of fs.readdirSync(dataDir).filter((x) => x.endsWith(".svg"))) {
      consume(`data/${f}`, lintSvgContent(fs.readFileSync(path.join(dataDir, f), "utf8")));
    }
  }
  // article.md インライン <svg>
  if (fs.existsSync(articleMd)) {
    const inline = extractInlineSvgs(fs.readFileSync(articleMd, "utf8"));
    inline.forEach((svg, i) => consume(`inline-svg#${i + 1}`, lintSvgContent(svg)));
  }

  return { slug, svgCount, errors, warnings, darkModeMissing, themeColorInline, details };
}

// ---------- 全記事走査 ----------
const slugs = fs
  .readdirSync(BASE, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const results = slugs
  .map(auditArticle)
  .filter((r) => r.svgCount > 0); // チャートを持つ記事のみ

// 優先度: errors 最優先 → dark mode 非対応数 → theme 色 inline 数
const ranked = [...results].sort((a, b) => {
  if (b.errors !== a.errors) return b.errors - a.errors;
  if (b.darkModeMissing !== a.darkModeMissing) return b.darkModeMissing - a.darkModeMissing;
  return b.themeColorInline - a.themeColorInline;
});

const summary = {
  generatedAt: new Date().toISOString(),
  base: path.relative(PROJECT_ROOT, BASE),
  articlesWithCharts: results.length,
  totalSvgs: results.reduce((s, r) => s + r.svgCount, 0),
  articlesWithErrors: results.filter((r) => r.errors > 0).length,
  articlesDarkModeNonCompliant: results.filter((r) => r.darkModeMissing > 0).length,
  articles: ranked.map((r) => ({
    slug: r.slug,
    svgCount: r.svgCount,
    errors: r.errors,
    warnings: r.warnings,
    darkModeMissing: r.darkModeMissing,
    themeColorInline: r.themeColorInline,
  })),
};

// 機械可読 JSON を常に state に保存 (brushup が読む)
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2), "utf8");

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(summary));
  process.exit(summary.articlesWithErrors > 0 ? 3 : 0);
}

// ---------- 人間向けレポート ----------
log(`\n=== チャート品質監査 (${summary.base}) ===`);
log(`チャート保有記事: ${summary.articlesWithCharts} / SVG 総数: ${summary.totalSvgs}`);
log(`構造エラーあり: ${summary.articlesWithErrors} 記事`);
log(`dark mode 非対応: ${summary.articlesDarkModeNonCompliant} 記事`);
log(`保存先: ${path.relative(PROJECT_ROOT, OUT_PATH)}\n`);

const top = ranked.filter((r) => r.errors > 0 || r.darkModeMissing > 0).slice(0, 30);
if (top.length === 0) {
  log("✓ 修正が必要な記事はありません");
} else {
  log("優先度順 (errors → dark mode 非対応 → theme 色 inline):");
  log("err  dark  inline  slug");
  for (const r of top) {
    log(
      `${String(r.errors).padStart(3)}  ${String(r.darkModeMissing).padStart(4)}  ` +
        `${String(r.themeColorInline).padStart(6)}  ${r.slug}`,
    );
  }
  log(
    `\n再生成は brushup サイクル (/brushup-blog --target batch) で data 再取得しながら行う。` +
      ` select-brushup-candidates.mjs が本監査の chartQuality を加味する。`,
  );
}

process.exit(summary.articlesWithErrors > 0 ? 3 : 0);
