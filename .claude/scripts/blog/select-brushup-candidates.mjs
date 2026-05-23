#!/usr/bin/env node
/**
 * ブログ brushup 候補を GSC snapshot から自動選定する。
 *
 * 改善余地スコア = impressions × max(0, INDUSTRY_AVG_CTR(position) - current_CTR)
 *
 * - 直近 7-90 日以内に rewrite した記事は除外 (dedup)
 * - 上位 N 件を JSON で stdout に出力
 *
 * Usage:
 *   node .claude/scripts/blog/select-brushup-candidates.mjs [--count 5] [--week 2026-W21] [--min-impressions 100]
 *
 * 出力 (1 行 1 candidate, JSON):
 *   { "slug": "...", "impressions": ..., "clicks": ..., "ctr": ..., "position": ..., "expectedLift": ..., "lastBrushupDate": ... }
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const COUNT = parseInt(getArg("--count", "5"), 10);
const MIN_IMPRESSIONS = parseInt(getArg("--min-impressions", "100"), 10);
const MAX_CTR = parseFloat(getArg("--max-ctr", "0.02"));
const DEDUP_DAYS = parseInt(getArg("--dedup-days", "90"), 10);

// Backlinko 2023 業界平均 CTR (position → CTR)
const INDUSTRY_AVG_CTR = {
  1: 0.396, 2: 0.187, 3: 0.105, 4: 0.075, 5: 0.053,
  6: 0.041, 7: 0.032, 8: 0.028, 9: 0.025, 10: 0.022,
  11: 0.017, 12: 0.014, 13: 0.013, 14: 0.011, 15: 0.010,
};
function industryAvgCtr(position) {
  const p = Math.round(position);
  if (p in INDUSTRY_AVG_CTR) return INDUSTRY_AVG_CTR[p];
  if (p < 1) return 0.396;
  if (p > 15) return 0.005;
  return 0.01;
}

// 最新 GSC snapshot 自動検出 (--week が指定されない場合)
function findLatestSnapshot() {
  const snapshotDir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots"
  );
  if (!fs.existsSync(snapshotDir)) return null;
  const weeks = fs.readdirSync(snapshotDir).filter((d) => /^\d{4}-W\d{2}$/.test(d));
  if (weeks.length === 0) return null;
  weeks.sort().reverse();
  return weeks[0];
}

const week = getArg("--week", findLatestSnapshot());
if (!week) {
  console.error("[error] GSC snapshot week not found");
  process.exit(1);
}

const pagesCsv = path.join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  week,
  "pages.csv"
);
if (!fs.existsSync(pagesCsv)) {
  console.error(`[error] pages.csv not found: ${pagesCsv}`);
  process.exit(1);
}

// dedup history (auto-brushup-history.json で管理)
const historyPath = path.join(
  PROJECT_ROOT,
  ".claude/state/blog/auto-brushup-history.json"
);
function loadHistory() {
  if (!fs.existsSync(historyPath)) return { entries: [] };
  return JSON.parse(fs.readFileSync(historyPath, "utf8"));
}
const history = loadHistory();
const recentlyBrushed = new Set();
const nowMs = Date.now();
const dedupCutoff = nowMs - DEDUP_DAYS * 24 * 60 * 60 * 1000;
for (const e of history.entries || []) {
  if (new Date(e.date).getTime() >= dedupCutoff) {
    recentlyBrushed.add(e.slug);
  }
}

// pages.csv 読み込み + filter
const csv = fs.readFileSync(pagesCsv, "utf8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim());
const candidates = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(",");
  if (cols.length < 5) continue;
  const url = cols[0];
  if (!url.includes("/blog/")) continue;
  const slug = url.replace(/^https?:\/\/[^/]+\/blog\//, "").replace(/\/$/, "");
  if (recentlyBrushed.has(slug)) continue;
  const clicks = parseInt(cols[1], 10) || 0;
  const impressions = parseInt(cols[2], 10) || 0;
  const ctr = parseFloat(cols[3]) || 0;
  const position = parseFloat(cols[4]) || 0;
  if (impressions < MIN_IMPRESSIONS) continue;
  if (ctr >= MAX_CTR) continue;
  // 改善余地スコア
  const gap = Math.max(0, industryAvgCtr(position) - ctr);
  const expectedLift = Math.round(impressions * gap * 4.3); // 月 clicks 換算 (×4.3 週)
  candidates.push({ slug, impressions, clicks, ctr, position, expectedLift });
}

// expectedLift で降順 sort、上位 COUNT 件
candidates.sort((a, b) => b.expectedLift - a.expectedLift);
const selected = candidates.slice(0, COUNT);

for (const c of selected) {
  console.log(JSON.stringify(c));
}

if (selected.length === 0) {
  console.error("[info] no candidates passed filter criteria");
  process.exit(2);
}
