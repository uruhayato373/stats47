#!/usr/bin/env node
/**
 * GSC SEO 改修 + 記事追加の効果計測
 *
 * 2026-05-17 に実施した SEO タイトル改修 10 件 + 新規記事 6 本の効果を、
 * 週次 GSC snapshot を diff して docs/05_改善ログ/gsc.md に追記する。
 *
 * Usage:
 *   node .claude/scripts/blog/measure-gsc-impact.mjs <before-week> <after-week>
 *   例: node .claude/scripts/blog/measure-gsc-impact.mjs 2026-W21 2026-W23
 *
 * - before-week: 改修前の GSC snapshot 週 (デフォルト: 2026-W21)
 * - after-week: 改修後の GSC snapshot 週 (デフォルト: 最新週)
 *
 * 改修対象は SEO_TARGETS / BLOG_TARGETS 定数で管理 (新規施策時はここに追加)。
 *
 * SKILL: 関連スキル無し (将来 /measure-gsc-impact として skill 化検討)
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots"
);
const LOG_PATH = path.join(PROJECT_ROOT, "docs/05_改善ログ/gsc.md");

// ====== 計測対象 ======

// 2026-05-17 SEO タイトル改修 10 件 → ranking ページ URL で集計
const SEO_TARGETS = [
  { metric_key: "wheat-flour-consumption-quantity", themes: ["小麦粉"] },
  { metric_key: "starting-salary-highschool", themes: ["高卒初任給"] },
  { metric_key: "post-office-count", themes: ["郵便局数"] },
  { metric_key: "inpatient-rate-per-100k", themes: ["入院受療率"] },
  { metric_key: "total-fertility-rate", themes: ["合計特殊出生率"] },
  { metric_key: "sake-consumption-quantity", themes: ["清酒", "日本酒"] },
  { metric_key: "fresh-udon-soba-consumption-quantity", themes: ["うどん"] },
  { metric_key: "konbu-consumption-quantity", themes: ["昆布"] },
  { metric_key: "outpatient-rate-per-100k", themes: ["外来受療率"] },
  { metric_key: "chicken-consumption-quantity", themes: ["鶏肉"] },
];

// 2026-05-17 新規 6 本のブログ → /blog/<slug> URL で集計
const BLOG_TARGETS = [
  {
    slug: "healthy-life-expectancy-male-female-gap",
    themes: ["健康寿命"],
  },
  { slug: "prefectural-height-male-female-gap", themes: ["平均身長"] },
  { slug: "roadside-station-prefecture-gap", themes: ["道の駅"] },
  { slug: "sugar-consumption-prefecture-gap", themes: ["砂糖消費量"] },
  { slug: "self-financing-ratio-prefecture-gap", themes: ["自主財源"] },
  { slug: "abortion-rate-prefecture-gap", themes: ["中絶", "人工妊娠"] },
];

// ====== 引数処理 ======

const [, , argBefore, argAfter] = process.argv;
const beforeWeek = argBefore || "2026-W21";

const availableWeeks = fs
  .readdirSync(SNAPSHOT_DIR)
  .filter((d) => /^\d{4}-W\d{2}$/.test(d))
  .sort();
const afterWeek = argAfter || availableWeeks[availableWeeks.length - 1];

console.log(`Comparing ${beforeWeek} → ${afterWeek}`);

if (!fs.existsSync(path.join(SNAPSHOT_DIR, beforeWeek, "queries.csv"))) {
  console.error(`❌ Before snapshot not found: ${beforeWeek}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(SNAPSHOT_DIR, afterWeek, "queries.csv"))) {
  console.error(`❌ After snapshot not found: ${afterWeek}`);
  process.exit(1);
}

// ====== CSV 読み込み ======

function loadQueries(week) {
  const p = path.join(SNAPSHOT_DIR, week, "queries.csv");
  const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
  return lines.map((l) => {
    const parts = l.split(",");
    const position = parseFloat(parts[parts.length - 1]);
    const ctr = parseFloat(parts[parts.length - 2]);
    const impressions = parseInt(parts[parts.length - 3], 10);
    const clicks = parseInt(parts[parts.length - 4], 10);
    const query = parts
      .slice(0, parts.length - 4)
      .join(",")
      .replace(/^"|"$/g, "");
    return { query, clicks, impressions, ctr, position };
  });
}

function loadPages(week) {
  const p = path.join(SNAPSHOT_DIR, week, "pages.csv");
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf8").trim().split("\n").slice(1);
  return lines.map((l) => {
    const parts = l.split(",");
    const position = parseFloat(parts[parts.length - 1]);
    const ctr = parseFloat(parts[parts.length - 2]);
    const impressions = parseInt(parts[parts.length - 3], 10);
    const clicks = parseInt(parts[parts.length - 4], 10);
    const page = parts
      .slice(0, parts.length - 4)
      .join(",")
      .replace(/^"|"$/g, "");
    return { page, clicks, impressions, ctr, position };
  });
}

const queriesBefore = loadQueries(beforeWeek);
const queriesAfter = loadQueries(afterWeek);
const pagesBefore = loadPages(beforeWeek);
const pagesAfter = loadPages(afterWeek);

// ====== 集計関数 ======

function aggregateByThemes(rows, themes, key = "query") {
  const matched = rows.filter((r) =>
    themes.some((t) => r[key].includes(t))
  );
  const totalImp = matched.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = matched.reduce((s, r) => s + r.clicks, 0);
  const weightedPos = matched.reduce(
    (s, r) => s + r.position * r.impressions,
    0
  );
  return {
    queries: matched.length,
    impressions: totalImp,
    clicks: totalClicks,
    ctr: totalImp > 0 ? totalClicks / totalImp : 0,
    position: totalImp > 0 ? weightedPos / totalImp : 0,
  };
}

function aggregateByPage(rows, slug) {
  const matched = rows.filter((r) => r.page.includes(`/blog/${slug}`));
  const totalImp = matched.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = matched.reduce((s, r) => s + r.clicks, 0);
  const weightedPos = matched.reduce(
    (s, r) => s + r.position * r.impressions,
    0
  );
  return {
    pages: matched.length,
    impressions: totalImp,
    clicks: totalClicks,
    ctr: totalImp > 0 ? totalClicks / totalImp : 0,
    position: totalImp > 0 ? weightedPos / totalImp : 0,
  };
}

function diff(before, after) {
  return {
    impressions: after.impressions - before.impressions,
    clicks: after.clicks - before.clicks,
    ctr_pp: (after.ctr - before.ctr) * 100, // percentage points
    position: after.position - before.position,
  };
}

function fmt(d) {
  return {
    impressions: `${d.impressions >= 0 ? "+" : ""}${d.impressions}`,
    clicks: `${d.clicks >= 0 ? "+" : ""}${d.clicks}`,
    ctr_pp: `${d.ctr_pp >= 0 ? "+" : ""}${d.ctr_pp.toFixed(2)}pp`,
    position: `${d.position >= 0 ? "+" : ""}${d.position.toFixed(1)}`,
  };
}

// ====== レポート生成 ======

let report = `\n## [BLOG-CTR-02] SEO タイトル改修 10 件 + 新規記事 6 本 (${beforeWeek} → ${afterWeek})\n\n`;
report += `- **status**: pending (要 ${afterWeek} 以降の継続観測)\n`;
report += `- **tier**: 2\n`;
report += `- **target_metric**: blog-ctr / ranking-ctr\n`;
report += `- **deployed_at**: 2026-05-17\n`;
report += `- **before**: ${beforeWeek} / **after**: ${afterWeek}\n\n`;

report += `### SEO タイトル改修 10 件 (検索クエリ別集計)\n\n`;
report += `| metric_key | クエリ含むテーマ | impressions | clicks | CTR | position |\n`;
report += `|---|---|---|---|---|---|\n`;

let seoTotalClicksBefore = 0;
let seoTotalClicksAfter = 0;
for (const t of SEO_TARGETS) {
  const before = aggregateByThemes(queriesBefore, t.themes);
  const after = aggregateByThemes(queriesAfter, t.themes);
  const d = fmt(diff(before, after));
  seoTotalClicksBefore += before.clicks;
  seoTotalClicksAfter += after.clicks;
  report += `| \`${t.metric_key}\` | ${t.themes.join("/")} | ${before.impressions}→${after.impressions} (${d.impressions}) | ${before.clicks}→${after.clicks} (${d.clicks}) | ${(before.ctr * 100).toFixed(1)}%→${(after.ctr * 100).toFixed(1)}% (${d.ctr_pp}) | ${before.position.toFixed(1)}→${after.position.toFixed(1)} (${d.position}) |\n`;
}
report += `\n**SEO 10 件合計**: clicks ${seoTotalClicksBefore} → ${seoTotalClicksAfter} (${seoTotalClicksAfter - seoTotalClicksBefore >= 0 ? "+" : ""}${seoTotalClicksAfter - seoTotalClicksBefore})\n`;

report += `\n### 新規記事 6 本 (ページ別集計)\n\n`;
report += `| slug | クエリ含むテーマ | クエリ集計 impressions | ページ集計 impressions/clicks |\n`;
report += `|---|---|---|---|\n`;

let blogTotalClicksAfter = 0;
for (const b of BLOG_TARGETS) {
  const queryAfter = aggregateByThemes(queriesAfter, b.themes);
  const pageAfter = aggregateByPage(pagesAfter, b.slug);
  blogTotalClicksAfter += pageAfter.clicks;
  report += `| \`${b.slug}\` | ${b.themes.join("/")} | ${queryAfter.impressions} (${queryAfter.queries} クエリ) | ${pageAfter.impressions} / ${pageAfter.clicks} clicks |\n`;
}
report += `\n**新規 6 本合計**: ページ集計 clicks ${blogTotalClicksAfter}\n`;

report += `\n### 判定\n\n`;
report += `- 想定: SEO 改修 +200 clicks/月、新規記事 6 本で +50-100 clicks/月\n`;
report += `- 実測: SEO ${seoTotalClicksAfter - seoTotalClicksBefore} clicks 差、新規記事 ${blogTotalClicksAfter} clicks\n`;
report += `- **[判定] effect/pending** — ${afterWeek} は集計 1 週分のみ、最低 2-4 週連続観測してから effect/full または effect/partial を確定する (.claude/rules/evidence-based-judgment.md 準拠)\n\n`;
report += `### 検証コマンド\n\n`;
report += `\`\`\`\nnode .claude/scripts/blog/measure-gsc-impact.mjs ${beforeWeek} <新しい週>\n\`\`\`\n`;

// ====== ログに append ======

const existingLog = fs.existsSync(LOG_PATH)
  ? fs.readFileSync(LOG_PATH, "utf8")
  : "";

// frontmatter の updated を今日に更新
const today = new Date().toISOString().slice(0, 10);
let updated = existingLog.replace(/^updated: \d{4}-\d{2}-\d{2}$/m, `updated: ${today}`);

// 既存に [BLOG-CTR-02] section がある場合は置換、無ければ append
if (updated.includes("## [BLOG-CTR-02]")) {
  console.log("⚠️  [BLOG-CTR-02] section already exists. Replacing with latest measurement.");
  updated = updated.replace(/\n## \[BLOG-CTR-02\][\s\S]*?(?=\n## |\n*$)/, report);
} else {
  // Find the position to insert (after frontmatter and intro, before first ## section)
  const firstSectionIdx = updated.indexOf("\n## ");
  if (firstSectionIdx >= 0) {
    updated =
      updated.slice(0, firstSectionIdx) +
      report +
      updated.slice(firstSectionIdx);
  } else {
    updated += report;
  }
}

fs.writeFileSync(LOG_PATH, updated);
console.log(`✓ Appended to ${LOG_PATH}`);
console.log(`\nSummary:`);
console.log(
  `  SEO 10 件: clicks ${seoTotalClicksBefore} → ${seoTotalClicksAfter} (${seoTotalClicksAfter - seoTotalClicksBefore >= 0 ? "+" : ""}${seoTotalClicksAfter - seoTotalClicksBefore})`
);
console.log(`  新規 6 本: page clicks ${blogTotalClicksAfter}`);
