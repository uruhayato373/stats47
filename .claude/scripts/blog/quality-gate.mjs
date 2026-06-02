#!/usr/bin/env node
/**
 * ブログ記事 brushup 後の自動品質ゲート (/brushup-blog --target article / batch 用)。
 *
 * 機械的にチェック可能な品質基準 (callout / 内部リンク / NG word / factual cross-check 等)
 * を全て script で検証する。1 つでも失敗したら exit 1 (skip 推奨)。
 *
 * Factual cross-check は `.claude/scripts/lib/article-factual-check.mjs` に切り出し済み。
 * 他 skill (publish-article / draft-from-trend 等) からも同 library が利用可能。
 *
 * Usage:
 *   node .claude/scripts/blog/quality-gate.mjs <slug>
 *
 * exit code:
 *   0 = pass (auto-merge OK)
 *   1 = fail (人間レビュー必要)
 *   2 = file not found
 *
 * 出力 (stdout JSON):
 *   { "pass": true|false, "checks": {...}, "warnings": [...], "blockers": [...] }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkArticleFactual } from "../lib/article-factual-check.mjs";
import { lintSourceLinkPlacement } from "../lib/article-structure-lint.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const arg = process.argv[2];
if (!arg) {
  console.error("usage: node quality-gate.mjs <slug | path/to/article.md>");
  process.exit(1);
}

// arg が .md ファイルパス (docs/21 ドラフト等) ならそのまま検査する。
// それ以外は slug とみなし .local/r2/app/blog/<slug>/ を解決する (CI publish パイプライン用)。
const looksLikePath = arg.endsWith(".md") || arg.includes("/");
let articlePath;
let dataDir;
if (looksLikePath) {
  articlePath = path.resolve(arg);
  dataDir = path.join(path.dirname(articlePath), "data");
} else {
  articlePath = path.join(PROJECT_ROOT, ".local/r2/app/blog", arg, "article.md");
  dataDir = path.join(PROJECT_ROOT, ".local/r2/app/blog", arg, "data");
}
const slug = looksLikePath ? path.basename(path.dirname(articlePath)) : arg;
if (!fs.existsSync(articlePath)) {
  console.error(`[error] article not found: ${articlePath}`);
  process.exit(2);
}

const content = fs.readFileSync(articlePath, "utf8");

// ============================================================================
// NG パターン (rice-harvest 失敗事例より学習)
// ============================================================================
// agent が機械的に curiosity gap を作ったときに陥りやすいパターン。
// これらの phrase は本質的価値を伴わない sensationalism の典型。
const NG_PATTERNS = [
  // 数値倍率の sensationalism (X倍格差、X倍差 単独)
  { pattern: /\d+,?\d*\s*倍格差/, name: "X倍格差 (sensationalism)" },
  { pattern: /\d{2,}\s*倍差(?!\s*の|を|は|が|が|・|、)/, name: "X倍差 単独 (sensationalism)" },
  // 主観的・扇情的形容
  { pattern: /驚愕の/, name: "驚愕の (扇情的)" },
  { pattern: /衝撃の/, name: "衝撃の (扇情的)" },
  { pattern: /(ヤバい|やばい)/, name: "ヤバい (口語扇情)" },
  { pattern: /信じられない/, name: "信じられない (扇情的)" },
  { pattern: /最大級/, name: "最大級 (主観的形容、根拠不明)" },
  { pattern: /最大の.*ヤミ/, name: "最大のヤミ (扇情的)" },
  // 単なる事実羅列タイトル化のパターン
  { pattern: /^title:\s*"[^"]*\d+位[^"]*"/m, name: "title 「N位」だけで終わる (curiosity gap 不足)" },
];

// ============================================================================
// 必須要素チェック
// ============================================================================
function countCallouts(text) {
  const matches = text.match(/^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/gm);
  return matches ? matches.length : 0;
}

function countInternalLinks(text) {
  const absMatches = text.match(/https:\/\/stats47\.jp\/(ranking|areas|category|blog|themes|tag|survey)/g) || [];
  const relMatches = text.match(/\]\(\/(ranking|areas|category|blog|themes|tag|survey)/g) || [];
  return absMatches.length + relMatches.length;
}

function countSvgCharts(text) {
  const matches = text.match(/<svg\s+[^>]*xmlns/g);
  return matches ? matches.length : 0;
}

function getCharCount(text) {
  const body = text.replace(/^---[\s\S]*?\n---\n/, "");
  return body.length;
}

function getH2Count(text) {
  const matches = text.match(/^##\s+\S/gm);
  return matches ? matches.length : 0;
}

function hasSeoTitle(text) {
  return /^seoTitle:\s*["'].+["']/m.test(text);
}

function hasDescription(text) {
  return /^description:\s*["']?.{50,}/m.test(text);
}

function hasDataSource(text) {
  return /## データ出典|## 出典|^- 農林水産省|^- 総務省|^- 厚生労働省|^- 国土交通省|^- e-Stat/m.test(text);
}

// ============================================================================
// チェック実行
// ============================================================================
const checks = {
  callouts: countCallouts(content),
  internalLinks: countInternalLinks(content),
  charts: countSvgCharts(content),
  charCount: getCharCount(content),
  h2Count: getH2Count(content),
  hasSeoTitle: hasSeoTitle(content),
  hasDescription: hasDescription(content),
  hasDataSource: hasDataSource(content),
};

const blockers = [];
const warnings = [];

for (const { pattern, name } of NG_PATTERNS) {
  if (pattern.test(content)) {
    blockers.push(`NG_PATTERN: ${name}`);
  }
}

if (checks.callouts < 2) {
  blockers.push(`callouts < 2 (actual: ${checks.callouts}) — 信頼性シグナル不足`);
}
if (checks.internalLinks < 3) {
  blockers.push(`internalLinks < 3 (actual: ${checks.internalLinks}) — PageRank 還流不足`);
}
if (!checks.hasSeoTitle) {
  blockers.push("seoTitle frontmatter 欠落");
}
if (!checks.hasDescription) {
  blockers.push("description frontmatter 欠落 or 短すぎる (< 50 chars)");
}
if (!checks.hasDataSource) {
  blockers.push("「データ出典」section 欠落");
}
if (checks.charCount < 3000) {
  blockers.push(`charCount < 3000 (actual: ${checks.charCount}) — 内容が薄い`);
}
if (checks.charCount > 25000) {
  warnings.push(`charCount > 25000 (actual: ${checks.charCount}) — 長すぎる可能性`);
}
if (checks.h2Count < 4) {
  blockers.push(`H2 sections < 4 (actual: ${checks.h2Count}) — 構造が浅い`);
}

if (checks.charts === 0) {
  warnings.push("チャート (SVG) 0 個 — visual 弱い");
}
if (checks.callouts < 3) {
  warnings.push(`callouts < 3 (actual: ${checks.callouts}) — 推奨は 3-4 個`);
}

// source-link 配置チェック (2026-05-28 追加、article-structure-lint.mjs に切り出し)
// /ranking/ リンクの末尾集約を検出。WARN 扱い (回遊性の問題だが描画は壊れない)。
const sourceLinkLint = lintSourceLinkPlacement(content);
checks.rankingSourceLinks = sourceLinkLint.stats.rankingSourceLinks;
checks.tailRankingLinks = sourceLinkLint.stats.tailRankingLinks;
warnings.push(...sourceLinkLint.warnings);

// Factual cross-check (2026-05-25 追加、article-factual-check.mjs に切り出し済)
const factual = checkArticleFactual(content, dataDir);
checks.groundTruthPrefCount = factual.groundTruthPrefCount;
checks.isPerCapitaArticle = factual.isPerCapitaArticle;
blockers.push(...factual.blockers);
warnings.push(...factual.warnings);

const result = {
  slug,
  pass: blockers.length === 0,
  checks,
  warnings,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
process.exit(blockers.length === 0 ? 0 : 1);
