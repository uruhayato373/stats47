#!/usr/bin/env node
/**
 * audit-article-structure.mjs
 *
 * 全ブログ記事の構造品質を一括監査する。現在は source-link 配置
 * (/ranking/ リンクの末尾集約アンチパターン) を検出。
 *
 * quality-gate.mjs が単一記事の publish ゲートなのに対し、本スクリプトは
 * 全記事を走査して「どの既存記事を直すべきか」を優先度付きで定量化する。
 * (audit-chart-quality.mjs の構造版)
 *
 * Usage:
 *   node .claude/scripts/blog/audit-article-structure.mjs [--base <dir>] [--json] [--out <path>]
 *
 *   --base <dir>  記事ルート。デフォルト: .local/r2/app/blog (R2 pull 後)
 *                 ドラフト監査なら --base docs/21_ブログ記事原稿
 *   --json        機械可読 JSON を stdout
 *   --out <path>  保存先。デフォルト: .claude/state/blog/structure-audit.json
 *
 * 注: 再配置は意味判断 (どの図にどのリンク) のため agent (brushup) が行う。
 *   本スクリプトは検出のみ。select-brushup-candidates.mjs が本 JSON を読む。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { lintSourceLinkPlacement } from "../lib/article-structure-lint.mjs";
import { lintInternalLinks } from "../lib/internal-link-lint.mjs";

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
  getArg("--out", ".claude/state/blog/structure-audit.json"),
);

const log = (m) => !JSON_OUT && console.log(m);

if (!fs.existsSync(BASE)) {
  console.error(`[error] base dir not found: ${BASE}`);
  console.error(`先に R2 を pull (/pull-r2 --prefix blog) するか、--base docs/21_ブログ記事原稿 を指定。`);
  process.exit(1);
}

function auditArticle(slug) {
  const articleMd = path.join(BASE, slug, "article.md");
  if (!fs.existsSync(articleMd)) return null;
  const md = fs.readFileSync(articleMd, "utf8");
  const { blockers, warnings, stats } = lintSourceLinkPlacement(md);
  const link = lintInternalLinks(md);
  return {
    slug,
    blockers: blockers.length + link.blockers.length,
    warnings: warnings.length + link.warnings.length,
    ...stats,
    ...link.stats,
  };
}

const slugs = fs
  .readdirSync(BASE, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const results = slugs.map(auditArticle).filter(Boolean);
// source-link カードを持つ記事 + 内部リンク切れを持つ記事 (カード無しでもリンク切れは拾う)
const withLinks = results.filter((r) => r.rankingSourceLinks > 0 || r.internalLinksBroken > 0);
// 違反 = source-link 配置の blocker (重複 / 連続配置 / 図なし節 / 末尾集約) が 1 件以上
const violations = withLinks
  .filter((r) => r.blockers > 0)
  .sort((a, b) => b.blockers - a.blockers || b.tailRankingLinks - a.tailRankingLinks);

const summary = {
  generatedAt: new Date().toISOString(),
  base: path.relative(PROJECT_ROOT, BASE),
  articlesScanned: results.length,
  articlesWithRankingLinks: withLinks.length,
  articlesViolating: violations.length,
  articles: violations.map((r) => ({
    slug: r.slug,
    blockers: r.blockers,
    dupRankingLinks: r.dupRankingLinks,
    adjacentClusters: r.adjacentClusters,
    noFigureSectionLinks: r.noFigureSectionLinks,
    tailRankingLinks: r.tailRankingLinks,
    inlineRankingLinks: r.inlineRankingLinks,
    figures: r.figures,
  })),
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2), "utf8");

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(summary));
  process.exit(0);
}

log(`\n=== 記事構造監査: source-link 配置 (${summary.base}) ===`);
log(`走査記事: ${summary.articlesScanned} / ランキングリンク保有: ${summary.articlesWithRankingLinks}`);
log(`配置違反: ${summary.articlesViolating} 記事`);
log(`保存先: ${path.relative(PROJECT_ROOT, OUT_PATH)}\n`);

if (violations.length === 0) {
  log("✓ source-link 配置の違反はありません");
} else {
  log("優先度順 (blocker 数):");
  log("blk  重複  連続  図なし  末尾  slug");
  for (const r of violations.slice(0, 40)) {
    log(
      `${String(r.blockers).padStart(3)}  ${String(r.dupRankingLinks).padStart(4)}  ` +
        `${String(r.adjacentClusters).padStart(4)}  ${String(r.noFigureSectionLinks).padStart(6)}  ` +
        `${String(r.tailRankingLinks).padStart(4)}  ${r.slug}`,
    );
  }
  log(
    `\n一括是正: node .claude/scripts/blog/fix-source-link-placement.mjs (決定的変換)。` +
      ` 個別の意味判断が要る分は brushup サイクルで agent が対応する。`,
  );
}

process.exit(0);
