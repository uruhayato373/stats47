#!/usr/bin/env node
/**
 * @deprecated 2026-05-29: cron 自律 brushup を廃止し /brushup-blog --target batch
 *   (ユーザー指示時のみ実行) に統合したため、30 日 plan / auto-brushup-plan.json は
 *   どの skill からも参照されない。候補選定は select-brushup-candidates.mjs を直接使う。
 *   このスクリプトは履歴のため残置 (新規呼び出し禁止)。
 *
 * 全 blog 記事を採点し、30 日 (or 任意期間) の brushup plan を生成する。
 *
 * Output:
 *   1. .claude/state/blog/auto-brushup-plan.json (routine が参照する schedule)
 *   2. .claude/state/blog/brushup-plan.md (再生成可能な運用state)
 *
 * Score 計算:
 *   improvement_score = impressions × max(0, industry_avg_CTR(position) - current_CTR)
 *                     × quality_penalty (quality gate 通らない記事は +50% 優先)
 *                     × recency_factor (旧記事は +20% 優先、新規記事は -50%)
 *
 * Usage:
 *   node .claude/scripts/blog/generate-brushup-plan.mjs [--days 30] [--per-day 5] [--report-only]
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const DAYS = parseInt(getArg("--days", "30"), 10);
const PER_DAY = parseInt(getArg("--per-day", "5"), 10);
const REPORT_ONLY = args.includes("--report-only");

// Industry average CTR (Backlinko 2023)
const INDUSTRY_AVG_CTR = {
  1: 0.396, 2: 0.187, 3: 0.105, 4: 0.075, 5: 0.053,
  6: 0.041, 7: 0.032, 8: 0.028, 9: 0.025, 10: 0.022,
  11: 0.017, 12: 0.014, 13: 0.013, 14: 0.011, 15: 0.010,
};
const industryAvgCtr = (p) => {
  const k = Math.round(p);
  if (k in INDUSTRY_AVG_CTR) return INDUSTRY_AVG_CTR[k];
  if (k < 1) return 0.396;
  if (k > 15) return 0.005;
  return 0.01;
};

// 最新 GSC snapshot
function findLatestSnapshot() {
  const dir = path.join(PROJECT_ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
  const weeks = fs.readdirSync(dir).filter((d) => /^\d{4}-W\d{2}$/.test(d));
  weeks.sort().reverse();
  return weeks[0];
}

const week = findLatestSnapshot();
const pagesCsv = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  week,
  "pages.csv"
);

// GSC pages → slug map
const gscMap = {};
const csv = fs.readFileSync(pagesCsv, "utf8").split(/\r?\n/).filter(Boolean);
for (let i = 1; i < csv.length; i++) {
  const cols = csv[i].split(",");
  if (cols.length < 5) continue;
  const url = cols[0];
  if (!url.includes("/blog/")) continue;
  const slug = url.replace(/^https?:\/\/[^/]+\/blog\//, "").replace(/\/$/, "");
  gscMap[slug] = {
    clicks: parseInt(cols[1], 10) || 0,
    impressions: parseInt(cols[2], 10) || 0,
    ctr: parseFloat(cols[3]) || 0,
    position: parseFloat(cols[4]) || 0,
  };
}

// 全 blog 記事一覧 (.local/r2/app/blog/)
const blogDir = path.join(PROJECT_ROOT, ".local/r2/app/blog");
const allSlugs = fs
  .readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((slug) => {
    const articlePath = path.join(blogDir, slug, "article.md");
    return fs.existsSync(articlePath);
  });

// 各記事を採点
const scored = [];
for (const slug of allSlugs) {
  const articlePath = path.join(blogDir, slug, "article.md");
  const content = fs.readFileSync(articlePath, "utf8");

  // GSC perf
  const gsc = gscMap[slug] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  // Quality check (run quality-gate.mjs 内部 logic、ただし quick check)
  const callouts = (content.match(/^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/gm) || []).length;
  const absLinks = (content.match(/https:\/\/stats47\.jp\/(ranking|areas|category|blog|themes|tag|survey)/g) || []).length;
  const relLinks = (content.match(/\]\(\/(ranking|areas|category|blog|themes|tag|survey)/g) || []).length;
  const internalLinks = absLinks + relLinks;
  const charts = (content.match(/<svg\s+[^>]*xmlns/g) || []).length;
  const body = content.replace(/^---[\s\S]*?\n---\n/, "");
  const charCount = body.length;
  const h2Count = (content.match(/^##\s+\S/gm) || []).length;

  // NG pattern 検出
  const ngPatterns = [
    /\d+,?\d*\s*倍格差/,
    /驚愕の/,
    /衝撃の/,
    /(ヤバい|やばい)/,
    /最大級/,
  ];
  const ngHits = ngPatterns.filter((p) => p.test(content)).length;

  // quality score (0-100、高いほど良い)
  let qualityScore = 50; // baseline
  qualityScore += Math.min(20, callouts * 5);          // callout 0-4 → 0-20
  qualityScore += Math.min(15, internalLinks * 2);     // link 0-7+ → 0-15
  qualityScore += Math.min(10, charts * 5);            // chart 0-2 → 0-10
  qualityScore += Math.min(10, Math.max(0, (h2Count - 3) * 2)); // h2 4-9 → 2-12
  qualityScore -= ngHits * 25;                          // NG pattern -25 each
  if (charCount < 3000) qualityScore -= 20;
  if (charCount > 15000) qualityScore -= 5;
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  // GSC published_at 推定 (frontmatter から)
  const publishedMatch = content.match(/^publishedAt:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
  const publishedAt = publishedMatch ? publishedMatch[1] : null;
  const ageMonths = publishedAt
    ? (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    : 12;

  // improvement_score (高いほど brushup 優先)
  const ctrGap = Math.max(0, industryAvgCtr(gsc.position) - gsc.ctr);
  const expectedLift = Math.round(gsc.impressions * ctrGap * 4.3); // 月 clicks
  const qualityPenalty = qualityScore < 60 ? 1.5 : 1.0;            // 低品質を優先
  const recencyFactor = ageMonths < 1 ? 0.5 : (ageMonths > 3 ? 1.2 : 1.0); // 新規は後回し
  const improvementScore = Math.round(expectedLift * qualityPenalty * recencyFactor);

  scored.push({
    slug,
    impressions: gsc.impressions,
    clicks: gsc.clicks,
    ctr: gsc.ctr,
    position: gsc.position,
    qualityScore,
    ngHits,
    callouts,
    internalLinks,
    charts,
    charCount,
    h2Count,
    publishedAt,
    ageMonths: Math.round(ageMonths * 10) / 10,
    expectedLift,
    improvementScore,
  });
}

// improvement_score で降順 sort
scored.sort((a, b) => b.improvementScore - a.improvementScore);

// 30 日 plan を構築 (improvement_score 上位から day-by-day で割り当て)
const plan = { generated_at: new Date().toISOString(), week, days: [] };
const totalSlots = DAYS * PER_DAY;
const scheduled = scored.slice(0, totalSlots);

// 日付ごとに分配 (1 日 PER_DAY 件)
const today = new Date();
for (let d = 0; d < DAYS; d++) {
  const date = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
  const dateStr = date.toISOString().slice(0, 10);
  const slots = scheduled.slice(d * PER_DAY, (d + 1) * PER_DAY).map((s) => ({
    slug: s.slug,
    expectedLift: s.expectedLift,
    qualityScore: s.qualityScore,
    impressions: s.impressions,
    currentCtr: s.ctr,
  }));
  if (slots.length > 0) {
    plan.days.push({ date: dateStr, slots });
  }
}

// summary 統計
const totalArticles = scored.length;
const lowQuality = scored.filter((s) => s.qualityScore < 60).length;
const ngHits = scored.filter((s) => s.ngHits > 0).length;
const totalExpectedLift = scheduled.reduce((sum, s) => sum + s.expectedLift, 0);

if (!REPORT_ONLY) {
  // JSON output for routine consumption
  const planPath = path.join(PROJECT_ROOT, ".claude/state/blog/auto-brushup-plan.json");
  fs.mkdirSync(path.dirname(planPath), { recursive: true });
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  console.log(`✅ Plan saved: ${planPath}`);
}

// Markdown report
const reportDate = today.toISOString().slice(0, 10);
const reportLines = [
  "---",
  `type: blog-brushup-plan`,
  `generated_at: ${plan.generated_at}`,
  `source_gsc_week: ${week}`,
  `total_articles: ${totalArticles}`,
  `days: ${DAYS}`,
  `per_day: ${PER_DAY}`,
  `total_expected_lift_monthly: ${totalExpectedLift}`,
  "---",
  "",
  `# Blog Brushup Plan (${reportDate} 起点 ${DAYS} 日間)`,
  "",
  "## サマリ",
  "",
  `- 全記事数: **${totalArticles}**`,
  `- 品質スコア < 60 の記事: **${lowQuality}** (${Math.round(lowQuality / totalArticles * 100)}%)`,
  `- NG pattern 検出記事: **${ngHits}**`,
  `- スケジュール対象: **${scheduled.length}** 記事 (${DAYS}日 × ${PER_DAY}/日)`,
  `- 想定月間 click リフト合計: **+${totalExpectedLift}** clicks/月`,
  "",
  "## 採点分布",
  "",
  "| 品質スコア帯 | 記事数 |",
  "|---|---|",
  `| 80-100 (高品質) | ${scored.filter(s => s.qualityScore >= 80).length} |`,
  `| 60-79 (中品質) | ${scored.filter(s => s.qualityScore >= 60 && s.qualityScore < 80).length} |`,
  `| 40-59 (要改善) | ${scored.filter(s => s.qualityScore >= 40 && s.qualityScore < 60).length} |`,
  `| 0-39 (緊急改善) | ${scored.filter(s => s.qualityScore < 40).length} |`,
  "",
  "## TOP 20 改善候補 (improvement_score 順)",
  "",
  "| 順 | slug | impressions | CTR | position | quality | 期待 +clicks/月 |",
  "|---:|---|---:|---:|---:|---:|---:|",
];
for (let i = 0; i < Math.min(20, scored.length); i++) {
  const s = scored[i];
  reportLines.push(
    `| ${i + 1} | \`${s.slug}\` | ${s.impressions} | ${(s.ctr * 100).toFixed(2)}% | ${s.position.toFixed(1)} | ${s.qualityScore} | +${s.expectedLift} |`
  );
}

reportLines.push("");
reportLines.push("## 30 日 日別プラン");
reportLines.push("");
for (const day of plan.days) {
  const dayTotal = day.slots.reduce((sum, s) => sum + s.expectedLift, 0);
  reportLines.push(`### ${day.date} (期待リフト +${dayTotal}/月)`);
  reportLines.push("");
  for (const slot of day.slots) {
    reportLines.push(`- \`${slot.slug}\` (imp ${slot.impressions}, CTR ${(slot.currentCtr * 100).toFixed(1)}%, quality ${slot.qualityScore}, +${slot.expectedLift})`);
  }
  reportLines.push("");
}

const reportPath = path.join(
  PROJECT_ROOT,
  ".claude/state/blog/brushup-plan.md"
);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, reportLines.join("\n"));
console.log(`✅ Report saved: ${reportPath}`);

// stdout summary
console.log("");
console.log(`Summary:`);
console.log(`  Total articles: ${totalArticles}`);
console.log(`  Low quality (< 60): ${lowQuality}`);
console.log(`  NG pattern hits: ${ngHits}`);
console.log(`  Scheduled: ${scheduled.length}`);
console.log(`  Expected lift total: +${totalExpectedLift} clicks/month`);
