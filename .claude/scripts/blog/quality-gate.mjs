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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkArticleFactual } from '../lib/article-factual-check.mjs';
import { lintSourceLinkPlacement } from '../lib/article-structure-lint.mjs';
import { lintParenNumbers } from '../lib/paren-number-lint.mjs';
import { lintInternalLinks, extractInternalLinks, isGoneBlogSlug } from '../lib/internal-link-lint.mjs';
import { inspectChartSourceManifest } from '../lib/chart-provenance.mjs';
import {
  lintSvgContent,
  lintSvgSize,
  lintChoroplethLegend,
  lintFindingsParity,
  lintScatterData,
  lintScatterParity,
  lintScatterQuality,
  lintTileGridQuality,
} from '../lib/svg-lint.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node quality-gate.mjs <slug | path/to/article.md>');
  process.exit(1);
}

// arg が .md ファイルパス (docs/21 ドラフト等) ならそのまま検査する。
// それ以外は slug とみなし .local/r2/app/blog/<slug>/ を解決する (CI publish パイプライン用)。
const looksLikePath = arg.endsWith('.md') || arg.includes('/');
let articlePath;
let dataDir;
if (looksLikePath) {
  articlePath = path.resolve(arg);
  dataDir = path.join(path.dirname(articlePath), 'data');
} else {
  articlePath = path.join(
    PROJECT_ROOT,
    '.local/r2/app/blog',
    arg,
    'article.md'
  );
  dataDir = path.join(PROJECT_ROOT, '.local/r2/app/blog', arg, 'data');
}
const slug = looksLikePath ? path.basename(path.dirname(articlePath)) : arg;
if (isGoneBlogSlug(slug)) {
  console.log(JSON.stringify({ pass: false, checks: { publicationAllowed: false }, warnings: [], blockers: [`公開終了済みのため再公開不可: ${slug} (GONE_BLOG_SLUGS)`] }));
  process.exit(1);
}
if (!fs.existsSync(articlePath)) {
  console.error(`[error] article not found: ${articlePath}`);
  process.exit(2);
}

const content = fs.readFileSync(articlePath, 'utf8');

// ============================================================================
// NG パターン (rice-harvest 失敗事例より学習)
// ============================================================================
// agent が機械的に curiosity gap を作ったときに陥りやすいパターン。
// これらの phrase は本質的価値を伴わない sensationalism の典型。
const NG_PATTERNS = [
  // 数値倍率の sensationalism (X倍格差、X倍差 単独)
  { pattern: /\d+,?\d*\s*倍格差/, name: 'X倍格差 (sensationalism)' },
  {
    pattern: /\d{2,}\s*倍差(?!\s*の|を|は|が|が|・|、)/,
    name: 'X倍差 単独 (sensationalism)',
  },
  // 主観的・扇情的形容
  { pattern: /驚愕の/, name: '驚愕の (扇情的)' },
  { pattern: /衝撃の/, name: '衝撃の (扇情的)' },
  { pattern: /(ヤバい|やばい)/, name: 'ヤバい (口語扇情)' },
  { pattern: /信じられない/, name: '信じられない (扇情的)' },
  { pattern: /最大級/, name: '最大級 (主観的形容、根拠不明)' },
  { pattern: /最大の.*ヤミ/, name: '最大のヤミ (扇情的)' },
  // 単なる事実羅列タイトル化のパターン
  {
    pattern: /^title:\s*"[^"]*\d+位[^"]*"/m,
    name: 'title 「N位」だけで終わる (curiosity gap 不足)',
  },
  // ランキング図の直後に置く truncated 表 (…/⋯/... で省略した部分複製) は読者価値ゼロ → 禁止 (2026-06-02)。
  // 表は「全件掲載」か「省略」の二択。図と重複する中途半端な抜粋表を作らない。
  {
    pattern: /^\s*\|\s*(…|⋯|\.\.\.)\s*\|/m,
    name: 'truncated 表 (…省略の部分複製表)。表は全件 or 省略にする',
  },
];

// ============================================================================
// 必須要素チェック
// ============================================================================
function countCallouts(text) {
  const matches = text.match(
    /^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/gm
  );
  return matches ? matches.length : 0;
}

function countInternalLinks(text) {
  return extractInternalLinks(text).length;
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
// markdown 表は全面禁止 (2026-06-04)。データは SVG 図、列挙/手順は箇条書きで表現する。
// GFM の表は区切り行 (|---|---|) を必ず 1 行持つので、それを 1 表ブロック = 1 件として数える。
// 「どの表なら OK か」の線引きを消すため、ランキング表/比較表/全件表を区別せず一律ブロックする。
function countMarkdownTables(text) {
  // frontmatter / code fence を除外してから区切り行を数える (誤検出防止)。
  let t = text.replace(/^---[\s\S]*?\n---\n/, '');
  t = t.replace(/```[\s\S]*?```/g, '');
  return (t.match(/^\s*\|[ :|-]+\|\s*$/gm) || []).length;
}

// charCount は「読者が読む地の文 (prose)」のみを数える。
// 表・画像参照・タグ (source-link 等)・リンクURL・見出し/引用記号・コード等の markup は
// 読者価値を伴わない水増し要因なので除外する (2026-06-02: 表で字数を稼ぐ gaming を封じる)。
function getCharCount(text) {
  let t = text.replace(/^---[\s\S]*?\n---\n/, ''); // frontmatter
  t = t.replace(/```[\s\S]*?```/g, ''); // code fence
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ''); // 画像参照
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, ''); // ペアHTML/カスタムタグ (source-link/affiliate-banner 等)
  t = t.replace(/<[^>]+>/g, ''); // 単独タグ
  t = t
    .split('\n')
    .filter((l) => !/^\s*\|/.test(l)) // 表行
    .join('\n');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // [text](url) → text
  t = t.replace(/^[ \t]*#{1,6}\s+/gm, ''); // 見出し記号
  t = t.replace(/^[ \t]*>\s?/gm, ''); // 引用/callout 記号
  t = t.replace(/[*_`~]/g, ''); // 強調記号
  return t.replace(/\s+/g, '').length; // 空白除いた地の文字数
}

function getH2Count(text) {
  const matches = text.match(/^##\s+\S/gm);
  return matches ? matches.length : 0;
}

// YAML はクォートを要求しないので、引用符の有無で判定しない (2026-07-31 修正)。
// 旧実装は `seoTitle: 製造品出荷額ランキング` を「欠落」と誤報していた。実コーパス 424 記事は
// 全件クォート付きで実害は無かったが、生成モデルが書く frontmatter では普通に起こる形で、
// しかもメッセージが「欠落」なので原因を誤らせる。description 側の判定と揃える。
function hasSeoTitle(text) {
  return /^seoTitle:\s*["']?\S/m.test(text);
}

function hasDescription(text) {
  return /^description:\s*["']?.{50,}/m.test(text);
}

function hasDataSource(text) {
  return /## データ出典|## 出典|^- 農林水産省|^- 総務省|^- 厚生労働省|^- 国土交通省|^- e-Stat/m.test(
    text
  );
}

// 文体チェック (2026-06-08): 本文は ですます調 に統一する (正典: blog-quality-standards.md「文体」)。
// である調 (である。/だ。/だった。/ではない。/だろう。/のだ。 等の plain copula 文末) を検出。
// 注: 地の文のみ対象。callout/引用 (> 行)・見出し・表・コード・タグ・frontmatter は除外
// (注記やデータ出典の体言止め・引用は別文体を許容するため)。plain 動詞終止形 (する。等) は
// 誤検出を避け gate では捕まえない (blog-critic の意味判断に委ねる)。copula である調が 1 つでも
// あれば「ですます調に統一されていない」と決定的に判定できる。
function getProseForTone(text) {
  let t = text.replace(/^---[\s\S]*?\n---\n/, ''); // frontmatter
  t = t.replace(/```[\s\S]*?```/g, ''); // code fence
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, ''); // ペアタグ
  t = t.replace(/<[^>]+>/g, ''); // 単独タグ
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ''); // 画像
  t = t
    .split('\n')
    .filter((l) => !/^\s*\|/.test(l)) // 表行
    .filter((l) => !/^\s*>/.test(l)) // callout / blockquote
    .filter((l) => !/^\s*#{1,6}\s/.test(l)) // 見出し
    .join('\n');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // リンク→テキスト
  return t;
}
const DEARU_ENDINGS = [
  /である[。、]/g,
  /であった[。、]/g,
  /だった[。、]/g,
  /ではない。/g, // 文末のみ。「ではなく、」「ではない、」等の連用中止は ですます と両立するため除外 (誤検知防止)
  /だろう[。、]/g,
  /のだ[。、]/g,
  /のである[。、]/g,
  /(?<![んでぐ])だ。/g, // 「だ。」終止 (んだ。/口語の ぐだ 等は除外)
];
function countDearuEndings(text) {
  const prose = getProseForTone(text);
  let n = 0;
  const samples = [];
  for (const p of DEARU_ENDINGS) {
    const m = prose.match(p) || [];
    n += m.length;
    if (m.length && samples.length < 4) samples.push(m[0]);
  }
  return { count: n, samples };
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
  dearuEndings: countDearuEndings(content).count,
};

const blockers = [];
const warnings = [];

for (const { pattern, name } of NG_PATTERNS) {
  if (pattern.test(content)) {
    blockers.push(`NG_PATTERN: ${name}`);
  }
}

if (checks.callouts < 2) {
  blockers.push(
    `callouts < 2 (actual: ${checks.callouts}) — 信頼性シグナル不足`
  );
}
if (checks.internalLinks < 3) {
  blockers.push(
    `internalLinks < 3 (actual: ${checks.internalLinks}) — PageRank 還流不足`
  );
}
if (!checks.hasSeoTitle) {
  blockers.push('seoTitle frontmatter 欠落');
}
if (!checks.hasDescription) {
  blockers.push('description frontmatter 欠落 or 短すぎる (< 50 chars)');
}
if (!checks.hasDataSource) {
  blockers.push('「データ出典」section 欠落');
}
if (checks.charCount < 1600) {
  blockers.push(
    `prose charCount < 1600 (actual: ${checks.charCount}) — スタブ (極端に薄い) の床。品質の量的判断は blog-critic に委ねる`
  );
}
if (checks.charCount < 2400) {
  warnings.push(
    `prose charCount < 2400 (actual: ${checks.charCount}) — やや短い (critic の意味判断で可否を決める)`
  );
}
if (checks.charCount > 25000) {
  warnings.push(
    `charCount > 25000 (actual: ${checks.charCount}) — 長すぎる可能性`
  );
}
if (checks.h2Count < 4) {
  blockers.push(`H2 sections < 4 (actual: ${checks.h2Count}) — 構造が浅い`);
}

// 文体: ですます調に統一 (である調 copula 文末を blocker。正典: blog-quality-standards.md「文体」)。
if (checks.dearuEndings > 0) {
  const { samples } = countDearuEndings(content);
  blockers.push(
    `である調 文末 ${checks.dearuEndings} 箇所 [${samples.join(',')}] — 本文は ですます調 に統一する ` +
      `(である。→です。/ だった。→でした。/ ではない。→ではありません。/ だろう。→でしょう。)。callout・引用は対象外`
  );
}

if (checks.charts === 0) {
  warnings.push('チャート (SVG) 0 個 — visual 弱い');
}
if (checks.callouts < 3) {
  warnings.push(`callouts < 3 (actual: ${checks.callouts}) — 推奨は 3-4 個`);
}

// 図あたり prose 字数 (厚みの担保 ★2026-06-06)。「SVG はあるが文章が薄い」を決定的に弾く。
// 実測: 良記事 ~600字/図 (各図の後に 3-4 段落の解釈) vs 薄い記事 ~280字/図 (図の後 1-2 文で次の図)。
// 総 prose 床だけでは「図を増やして 1 図 1-2 文」を弾けないため、図あたり字数を床にする。
// 副次効果: 図を増やすほど分母が増え prose 要求も増える → まとめ findings 図/装飾 SVG での水増しが不能。
// チャート 0 の記事には適用しない (表禁止チェック・チャート0 warning が別途カバー)。
// 正典: .claude/rules/blog-quality-standards.md「図あたり prose 字数の床」。
if (checks.charts >= 1) {
  const prosePerChart = Math.round(checks.charCount / checks.charts);
  checks.prosePerChart = prosePerChart;
  if (prosePerChart < 350) {
    blockers.push(
      `prose/図 = ${prosePerChart}字 (charts: ${checks.charts}, prose: ${checks.charCount}) < 350 — ` +
        `図を貼って解説が薄い。各図の直後に「なぜ上位/下位か」の解釈段落を足す (良記事は ~600字/図)。図を減らすのも可`
    );
  } else if (prosePerChart < 550) {
    warnings.push(
      `prose/図 = ${prosePerChart}字 (charts: ${checks.charts}) < 550 — 図あたりの解説がやや薄い (良記事は ~600字/図、critic の意味判断で可否)`
    );
  }
}

// source-link 配置チェック (2026-05-28 追加、article-structure-lint.mjs に切り出し)
// 2026-07-24: 重複カード / 連続配置 / 図の無い節への配置 / 末尾集約 を blocker 化。
// カードの羅列は「どのリンクがどの図に対応するか」を失わせ、読者には無関係なリンクに見える。
const sourceLinkLint = lintSourceLinkPlacement(content);
checks.rankingSourceLinks = sourceLinkLint.stats.rankingSourceLinks;
checks.tailRankingLinks = sourceLinkLint.stats.tailRankingLinks;
checks.dupRankingLinks = sourceLinkLint.stats.dupRankingLinks;
checks.adjacentClusters = sourceLinkLint.stats.adjacentClusters;
checks.noFigureSectionLinks = sourceLinkLint.stats.noFigureSectionLinks;
blockers.push(...sourceLinkLint.blockers);
warnings.push(...sourceLinkLint.warnings);

// 括弧内数値挿入 (2026-07-31 追加、paren-number-lint.mjs)
// 「都道府県名の直後に括弧で値・順位を入れない」= blog-quality-standards.md「数値の書き方」。
// 括弧内の数値は factual-check が照合対象から外すため (主指標か別指標かを機械が判別できない)、
// 括弧に入れた瞬間に検証されなくなる。散文へ開けば照合対象に入る。
// 既存負債は公開済み 424 記事の 79.5% だが、gate がかかるのは「これから公開する記事」なので
// 既存は brushup で順次是正される (是正キューが blocker として拾う)。
const parenLint = lintParenNumbers(content);
checks.parenNumbers = parenLint.hits.length;
blockers.push(...parenLint.blockers);

// 内部リンクの実在チェック (2026-07-24 追加、internal-link-lint.mjs)
// 実在しない ranking key は HTTP 200 + 「ランキングが見つかりません」の soft 404 を返すため、
// ステータス監視では捕まらない。repo 内の key 集合と突合して公開前に弾く。
const linkLint = lintInternalLinks(content);
checks.internalLinksUnique = linkLint.stats.internalLinksUnique;
checks.internalLinksBroken = linkLint.stats.internalLinksBroken;
blockers.push(...linkLint.blockers);
warnings.push(...linkLint.warnings);

// markdown 表の全面禁止 (2026-06-04): データは SVG 図、列挙/手順は箇条書きで表現する。
// 旧「チャート0 / 上下非対称 / truncated 表」の個別判定は「表禁止」に包含されるため廃止。
const markdownTables = countMarkdownTables(content);
checks.markdownTables = markdownTables;
if (markdownTables > 0) {
  blockers.push(
    `markdown 表 ${markdownTables} 件 — 記事に表は禁止。データは SVG 図 (上位5+下位5 等)、列挙/手順は箇条書きにすること`
  );
}

// 表現の正典統一 (2026-06-02 追加): chart-placeholder 未描画 / インライン svg / 記事内関連セクション禁止。
// チャートは「生成画像 ![](data/*.svg)」に統一。関連ランキング/関連記事はページ側コンポーネントが正典。
checks.chartPlaceholder = /<chart-placeholder/.test(content);
checks.inlineSvg = /<svg[\s>]/.test(content);
checks.inArticleRelated = /^#{2,3}\s*関連(ランキング|記事)/m.test(content);
if (checks.chartPlaceholder) {
  blockers.push(
    'chart-placeholder (未描画) — 生成画像 SVG ![](data/*.svg) に置換すること'
  );
}
if (checks.inlineSvg) {
  blockers.push(
    'インライン <svg> — チャートは生成画像 ![](data/*.svg) に統一 (インライン svg 禁止)'
  );
}
if (checks.inArticleRelated) {
  blockers.push(
    '記事内『関連ランキング/関連記事』セクション — ページ側コンポーネント (RelatedRankingsSection / BlogRelatedArticlesSection) が正典。記事 markdown からは削除'
  );
}

// Factual cross-check (2026-05-25 追加、article-factual-check.mjs に切り出し済)
const factual = checkArticleFactual(content, dataDir);
checks.groundTruthPrefCount = factual.groundTruthPrefCount;
checks.isPerCapitaArticle = factual.isPerCapitaArticle;
blockers.push(...factual.blockers);
warnings.push(...factual.warnings);

// fail-closed: rank 主張があるのに ground truth (data/*.json) が無い記事は「検証不能」= blocker。
// (2026-06-08 追加) cron 自動生成ドラフトが data 無しで rank を捏造 → factual-check は gt 空だと
// skip するため素通りしていた穴を塞ぐ。「N位」を 2 件以上含むのに groundTruthPrefCount===0 なら、
// 数値が一切検証できない状態での公開を止める。data/*.json を生成して再検証すること。
// rank 主張の無い解説記事 (guide 等) は対象外 (rankClaimCount < 2 でスルー)。
const rankClaimCount = (
  getProseForTone(content).match(/(?<![・、と\d])\d+\s*位/g) || []
).length;
checks.rankClaimCount = rankClaimCount;
if (rankClaimCount >= 2 && checks.groundTruthPrefCount === 0) {
  blockers.push(
    `rank 主張 ${rankClaimCount} 件あるが data/*.json (ground truth) が無く検証不能 — ` +
      `数値捏造リスク。/page-data-batch か R2 values から data を生成し factual-check を通すこと`
  );
}

// SVGデータ系譜 gate (2026-06-20 追加・再発防止): 各 data/*.svg は data/<name>.json (再生成用) +
// .source.json (出典manifest) の3点セットが必須 (blog-data-schema.md §1.5)。SVG だけ残って元データが
// 消えると再生成・出典追跡が不能になる事故 (棚卸しで 612枚中 56% が元データ消失) の再発防止。
// blocker (徹底・2026-06-20 昇格): generator (generate-article-charts) が SVG とセットで source.json を必ず
// 出力するため新規記事は通る。既存負債を再公開する記事は復元 (backfill/ssot-restore) してから公開すること。
const svgRefs = [
  ...new Set(
    [...content.matchAll(/\]\(data\/([^)]+)\.svg\)/g)].map((m) => m[1])
  ),
];

// 参照 SVG の実在 gate (2026-07-31 追加): article.md が `![](data/x.svg)` と書いているのに
// ファイルが無ければ本番で画像切れになる。系譜 gate は .json/.source.json しか見ておらず、
// SVG 本体の欠落は誰も検査していなかった (実測: 公開済み 424 記事中 3 記事 / 8 枚が画像切れ)。
const missingSvgFiles = svgRefs.filter(
  (base) => !fs.existsSync(path.join(dataDir, `${base}.svg`))
);
checks.missingSvgFiles = missingSvgFiles.length;
if (missingSvgFiles.length > 0) {
  blockers.push(
    `参照 SVG が存在しない ${missingSvgFiles.length}/${svgRefs.length} 件: ` +
      `${missingSvgFiles.slice(0, 3).join(', ')}${missingSvgFiles.length > 3 ? ' 他' : ''} — ` +
      `本番で画像切れになる。generate-article-charts を通すか本文の参照を外すこと`
  );
}

// SVG basename の型判別可能性 gate (2026-07-31 追加): `chart-1` / `inline-chart-2` のような
// 無意味名は blog-svg-chart-standards.md §4 が明確に禁止している。型 (bar/map/line/…) を
// 名前から判定できないと再生成もサイズ検査もディスパッチできない (実測: 公開済み 19 枚)。
// suffix 規約 (-ranking/-map/…) 全体の遵守は既存負債 14.9% のため gate にしない。
const MEANINGLESS_BASENAME_RE = /(?:^|-)(?:inline-)?chart-?\d+$/i;
const meaninglessNames = svgRefs.filter((base) =>
  MEANINGLESS_BASENAME_RE.test(base)
);
checks.meaninglessSvgNames = meaninglessNames.length;
if (meaninglessNames.length > 0) {
  blockers.push(
    `型を判別できない SVG 名 ${meaninglessNames.length} 件: ${meaninglessNames.join(', ')} — ` +
      `blog-svg-chart-standards.md §4 の canonical 命名 (*-ranking / *-map / *-scatter / ` +
      `*-timeseries / *-stacked / *-summary-findings) に沿った名前にすること`
  );
}

const lineageMissing = [];
for (const base of svgRefs) {
  const hasJson = fs.existsSync(path.join(dataDir, `${base}.json`));
  const hasSource = fs.existsSync(path.join(dataDir, `${base}.source.json`));
  if (!hasJson || !hasSource) {
    const miss = [!hasJson && 'json', !hasSource && 'source.json']
      .filter(Boolean)
      .join('+');
    lineageMissing.push(`${base}.svg (${miss}欠落)`);
  }
}
checks.svgLineageMissing = lineageMissing.length;
if (lineageMissing.length > 0) {
  blockers.push(
    `SVGデータ系譜の欠落 ${lineageMissing.length}/${svgRefs.length} 件: ` +
      `${lineageMissing.slice(0, 3).join(', ')}${lineageMissing.length > 3 ? ' 他' : ''} — ` +
      `各 SVG は .json + .source.json の3点セット必須 (§1.5/§1.7)。` +
      `generator(generate-article-charts)を通すか SSOTから復元(backfill-source/regenerate-*)して揃えること`
  );
}

// SVG サイズ統一 gate (2026-06-21 追加・再発防止): 各 data/*.svg の viewBox 幅がカタログの
// 正規サイズ (blog-svg-chart-standards.md §5) に一致するか検査。統一済み (ranking 960/680・
// tilemap 600・findings 960) は blocker / 未統一 (scatter/line/stacked) は warning。
// 新規記事・校正で非正規サイズ SVG が混入するのを公開前に止める。
// 併せて SVG 本体の構造 lint (lintSvgContent) もここで回す (2026-07-31 配線)。
// viewBox/width/height/閉じタグの欠落 = 描画が壊れる、<text> の "undefined"/NaN/[object Object]
// = 生成器がテンプレート値を解決できていない、を error として弾く。従来 audit-chart-quality
// (バッチ) と generate-article-charts (--validate) にしか配線されておらず、公開前 gate は
// これを見ていなかった。実測影響は公開済み 424 記事中 1 記事 (0.2%) で安全に blocker 化できる。
// dark mode 非対応 / theme 色 inline の 2 つは warning のまま (140 枚該当・再生成で解消)。
const sizeBlockers = [];
const sizeWarnings = [];
const contentErrors = [];
const contentWarnings = [];
for (const base of svgRefs) {
  const svgFile = path.join(dataDir, `${base}.svg`);
  if (!fs.existsSync(svgFile)) continue; // 欠落は実在 gate が別途捕捉
  const svg = fs.readFileSync(svgFile, 'utf8');
  const { errors, warnings } = lintSvgSize(`${base}.svg`, svg);
  sizeBlockers.push(...errors);
  sizeWarnings.push(...warnings);
  const structural = lintSvgContent(svg, `${base}.svg`);
  contentErrors.push(...structural.errors.map((e) => `${base}.svg: ${e}`));
  contentWarnings.push(...structural.warnings.map((w) => `${base}.svg: ${w}`));
}
checks.svgContentErrors = contentErrors.length;
if (contentErrors.length > 0) {
  blockers.push(
    `SVG 構造エラー ${contentErrors.length} 件: ` +
      `${contentErrors.slice(0, 2).join(' / ')}${contentErrors.length > 2 ? ' 他' : ''}`
  );
}
if (contentWarnings.length > 0) {
  warnings.push(
    `SVG 品質 warning ${contentWarnings.length} 件: ` +
      `${contentWarnings.slice(0, 2).join(' / ')}${contentWarnings.length > 2 ? ' 他' : ''}`
  );
}
checks.svgSizeViolations = sizeBlockers.length + sizeWarnings.length;
if (sizeBlockers.length > 0) {
  blockers.push(
    `SVG 非正規サイズ ${sizeBlockers.length} 件 (アスペクト比統一): ` +
      `${sizeBlockers.slice(0, 2).join(' / ')}${sizeBlockers.length > 2 ? ' 他' : ''}`
  );
}

// SVG × json ペア gate (2026-07-13 追加・再発防止): ①choropleth 凡例の意味的ラベル
// (安全/危険 等) が json の legendLabels 明示なしに焼き込まれていないか ②findings カードの
// json heading/text が SVG に全て描画されているか (renderer の heading 脱落バグの再発防止)。
const pairBlockers = [];
for (const base of svgRefs) {
  const svgFile = path.join(dataDir, `${base}.svg`);
  const jsonFile = path.join(dataDir, `${base}.json`);
  const sourceFile = path.join(dataDir, `${base}.source.json`);
  if (!fs.existsSync(svgFile) || !fs.existsSync(jsonFile)) continue; // 欠落は lineage gate が捕捉
  let jsonData;
  try {
    jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  } catch (error) {
    pairBlockers.push(
      `${base}.json を解析できない: ${error instanceof Error ? error.message : String(error)}`
    );
    continue;
  }
  let sourceData;
  if (fs.existsSync(sourceFile)) {
    try {
      sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
      const sourceInspection = inspectChartSourceManifest(sourceData);
      if (sourceInspection.verdict === 'invalid') {
        pairBlockers.push(
          `${base}.source.json は再取得不能: ${sourceInspection.detail}`
        );
      }
    } catch (error) {
      pairBlockers.push(
        `${base}.source.json を解析できない: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  const svg = fs.readFileSync(svgFile, 'utf8');
  pairBlockers.push(
    ...lintChoroplethLegend(`${base}.svg`, svg, jsonData).errors
  );
  pairBlockers.push(...lintFindingsParity(`${base}.svg`, svg, jsonData).errors);
  pairBlockers.push(
    ...lintScatterData(`${base}.svg`, jsonData, sourceData).errors
  );
  pairBlockers.push(...lintScatterParity(`${base}.svg`, svg, jsonData).errors);
  pairBlockers.push(...lintScatterQuality(`${base}.svg`, svg, jsonData).errors);
  // タイルマップの品質不変量 (キャンバス比・透過背景・テーマ非依存・凡例位置)
  pairBlockers.push(
    ...lintTileGridQuality(`${base}.svg`, svg, jsonData).errors
  );
}
checks.svgPairViolations = pairBlockers.length;
if (pairBlockers.length > 0) {
  blockers.push(
    `SVG×json ペア検査 ${pairBlockers.length} 件: ` +
      `${pairBlockers.slice(0, 2).join(' / ')}${pairBlockers.length > 2 ? ' 他' : ''}`
  );
}

if (sizeWarnings.length > 0) {
  warnings.push(
    `SVG 非正規サイズ ${sizeWarnings.length} 件 (未統一カタログ): ` +
      `${sizeWarnings.slice(0, 2).join(' / ')}${sizeWarnings.length > 2 ? ' 他' : ''}`
  );
}

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
  (/^published:\s*true\s*$/m.test(content) ||
    /^publishedAt:\s*\d{4}-\d{2}-\d{2}\s*$/m.test(content));
const reviewPath = path.join(path.dirname(articlePath), 'review.md');
let hasCriticPass = false;
if (fs.existsSync(reviewPath)) {
  const rv = fs.readFileSync(reviewPath, 'utf8');
  // verdict: PASS かつ実体のある review (短いダミーを弾く)
  hasCriticPass =
    /^verdict:\s*PASS\b/im.test(rv) && rv.replace(/\s+/g, '').length > 200;
}
checks.published = isPublished;
checks.criticReviewed = hasCriticPass;
if (isPublished && !hasCriticPass) {
  blockers.push(
    'critic レビュー未通過: 公開記事は blog-critic の review.md (verdict: PASS, 実体200字以上) が必須。' +
      '自分が書いた記事を自分で採点して公開してはならない (別 agent の意味レビューを通すこと)'
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
