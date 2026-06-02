#!/usr/bin/env node
/**
 * ブログ記事の【公開前・機械的フロアチェック】(品質判定ではない)。
 *
 * ★ これは「品質を測る」ものではなく「機械的に検出できる欠陥 (床) を弾く」ものである。
 *   - 捕まえる: callout/内部リンク/NG word/factual rank 不一致/truncated 表/source-link 配置/
 *     prose 文字数の床/critic レビュー未通過 など【決定的に判定できる事項】。
 *   - 捕まえられない: 読者価値・冗長性・論理の質・curiosity gap の真正性などの【意味的品質】。
 *     これらは blog-critic (expert/panel review) が別コンテキストで判断する (review.md)。
 *   文字数 (prose) は「薄すぎ」を弾く床であって品質指標ではない。表/markup では稼げない。
 *
 * 1 つでも blocker があれば exit 1。
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
  // ランキング図の直後に置く truncated 表 (…/⋯/... で省略した部分複製) は読者価値ゼロ → 禁止 (2026-06-02)。
  // 表は「全件掲載」か「省略」の二択。図と重複する中途半端な抜粋表を作らない。
  { pattern: /^\s*\|\s*(…|⋯|\.\.\.)\s*\|/m, name: "truncated 表 (…省略の部分複製表)。表は全件 or 省略にする" },
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
  // チャートは ![alt](data/foo.svg) の画像参照で埋め込まれる (インライン <svg> は稀)。
  // 両方を数える (旧実装は画像参照を取りこぼし全記事 0 と誤検出していた)。
  const inline = (text.match(/<svg\s+[^>]*xmlns/g) || []).length;
  const imgRef = (text.match(/!\[[^\]]*\]\([^)]*\.svg\)/g) || []).length;
  return inline + imgRef;
}

// ランキング表 (「順位」/rank 列を持つ表) を検出し、上下非対称かを判定する。
// 標準は「上位5+下位5 の SVG チャート」。表だけ・上下非対称表・truncated 表は不可。
// 5 vs 10 の本数差は gate では判定しない (良記事=top10+bottom10 を誤爆しないため。本数は
// blog-quality-standards.md の基準 + blog-critic の意味判断に委ねる)。
function detectRankingTables(text) {
  const tables = [];
  let cur = null;
  for (const ln of text.split("\n")) {
    if (/^\s*\|.*\|\s*$/.test(ln)) (cur ??= []).push(ln);
    else if (cur) {
      tables.push(cur);
      cur = null;
    }
  }
  if (cur) tables.push(cur);
  return tables
    .filter((rows) => /順位|rank/i.test(rows[0] || ""))
    .map((rows) => {
      const ranks = [];
      for (const r of rows.slice(2)) {
        const m = r.match(/^\s*\|\s*(\d{1,2})\s*\|/);
        if (m) ranks.push(Number(m[1]));
      }
      const topRun = ranks.filter((r) => r <= 12).length;
      const bottomRun = ranks.filter((r) => r >= 36).length;
      const noMiddle = !ranks.some((r) => r > 12 && r < 36);
      const asymmetric = topRun >= 3 && bottomRun >= 1 && topRun !== bottomRun && noMiddle && ranks.length < 47;
      return { topRun, bottomRun, asymmetric };
    });
}

// charCount は「読者が読む地の文 (prose)」のみを数える。
// 表・画像参照・タグ (source-link 等)・リンクURL・見出し/引用記号・コード等の markup は
// 読者価値を伴わない水増し要因なので除外する (2026-06-02: 表で字数を稼ぐ gaming を封じる)。
function getCharCount(text) {
  let t = text.replace(/^---[\s\S]*?\n---\n/, ""); // frontmatter
  t = t.replace(/```[\s\S]*?```/g, ""); // code fence
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ""); // 画像参照
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, ""); // ペアHTML/カスタムタグ (source-link/affiliate-banner 等)
  t = t.replace(/<[^>]+>/g, ""); // 単独タグ
  t = t
    .split("\n")
    .filter((l) => !/^\s*\|/.test(l)) // 表行
    .join("\n");
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"); // [text](url) → text
  t = t.replace(/^[ \t]*#{1,6}\s+/gm, ""); // 見出し記号
  t = t.replace(/^[ \t]*>\s?/gm, ""); // 引用/callout 記号
  t = t.replace(/[*_`~]/g, ""); // 強調記号
  return t.replace(/\s+/g, "").length; // 空白除いた地の文字数
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
if (checks.charCount < 1600) {
  blockers.push(`prose charCount < 1600 (actual: ${checks.charCount}) — スタブ (極端に薄い) の床。品質の量的判断は blog-critic に委ねる`);
}
if (checks.charCount < 2400) {
  warnings.push(`prose charCount < 2400 (actual: ${checks.charCount}) — やや短い (critic の意味判断で可否を決める)`);
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

// ランキング表現の一貫性 (2026-06-02 追加): 標準は「上位5+下位5 の SVG チャート」。
// 表だけ (チャート0) / 上下非対称表 / truncated 表は不可。本数 (5 vs 10) は基準 + critic 判断。
const rankingTbls = detectRankingTables(content);
checks.rankingTables = rankingTbls.length;
if (rankingTbls.length > 0 && checks.charts === 0) {
  blockers.push(
    "ランキング表ありチャート0 — ランキングは上位5+下位5 の SVG チャートで可視化すること (表だけは不可)",
  );
}
const asym = rankingTbls.find((t) => t.asymmetric);
if (asym) {
  blockers.push(
    `上下非対称ランキング表 (top${asym.topRun}/bottom${asym.bottomRun}) — 上位N+下位N を対称にするか SVG 化`,
  );
}

// Factual cross-check (2026-05-25 追加、article-factual-check.mjs に切り出し済)
const factual = checkArticleFactual(content, dataDir);
checks.groundTruthPrefCount = factual.groundTruthPrefCount;
checks.isPerCapitaArticle = factual.isPerCapitaArticle;
blockers.push(...factual.blockers);
warnings.push(...factual.warnings);

// ============================================================================
// critic レビュー必須 (公開記事は「別 agent の意味レビュー」を経ること) ★再発防止
// ============================================================================
// 2026-06-02: 「書いた本人が自己採点して機械 gate だけ通す → 意味的に無価値な要素
// (例: 図と重複する truncated 表) が公開される」という事故の再発防止。
// このゲートはあくまで【機械的フロアチェック】であり品質判定ではない。意味的品質
// (冗長・図表重複・読者価値・curiosity gap の真正性) は blog-critic (expert/panel
// review) が別コンテキストで判断する。published:true の記事は blog-critic が書いた
// review.md (verdict: PASS) を必須とし、自己採点での公開を構造的に不可能にする。
// 公開判定: 新記事は `published: true`、旧記事は `publishedAt: <実日付>` のみ (published 行なし)。
// どちらも「公開」とみなし critic ゲートの対象にする (旧スタイルの素通りを防ぐ)。
// ドラフトは publishedAt: 未定 / published: false で除外される。
const explicitFalse = /^published:\s*false\s*$/m.test(content);
const isPublished =
  !explicitFalse &&
  (/^published:\s*true\s*$/m.test(content) || /^publishedAt:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(content));
const reviewPath = path.join(path.dirname(articlePath), "review.md");
let hasCriticPass = false;
if (fs.existsSync(reviewPath)) {
  const rv = fs.readFileSync(reviewPath, "utf8");
  // verdict: PASS かつ実体のある review (短いダミーを弾く)
  hasCriticPass = /^verdict:\s*PASS\b/im.test(rv) && rv.replace(/\s+/g, "").length > 200;
}
checks.published = isPublished;
checks.criticReviewed = hasCriticPass;
if (isPublished && !hasCriticPass) {
  blockers.push(
    "critic レビュー未通過: 公開記事は blog-critic の review.md (verdict: PASS, 実体200字以上) が必須。" +
      "自分が書いた記事を自分で採点して公開してはならない (別 agent の意味レビューを通すこと)",
  );
}

const result = {
  slug,
  pass: blockers.length === 0,
  checks,
  warnings,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
process.exit(blockers.length === 0 ? 0 : 1);
