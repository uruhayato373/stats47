#!/usr/bin/env node
/**
 * SNS Weekly Report Generator (data portion)
 *
 * .claude/skills/analytics/sns-metrics-improvement/snapshots/ から週次データを読み、
 * docs/04_レビュー/sns-weekly-report/YYYY-Www.md にプラットフォーム別サマリ + 上位投稿表を生成。
 *
 * AI 分析・next action のコメントは `/sns-weekly-report` skill 経由で追記する設計
 * （自動化はデータ部のみ、定性判断は人 or Claude Routine で）。
 *
 * Usage:
 *   node .claude/scripts/sns/sns-weekly-report.mjs                     # 前週
 *   node .claude/scripts/sns/sns-weekly-report.mjs 2026-W19            # 指定週
 *   node .claude/scripts/sns/sns-weekly-report.mjs --dry-run
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const require = createRequire(import.meta.url);
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-metrics-store.cjs"));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WEEK_ARG = args.find((a) => /^\d{4}-W\d{2}$/.test(a));

function isoWeekToDates(weekId) {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!m) throw new Error(`Invalid week id: ${weekId}`);
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const monday = new Date(week1Mon);
  monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
  };
}

function getPreviousWeekId() {
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 7);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function summarize(rows) {
  const byPlatform = {};
  for (const r of rows) {
    const p = r.platform || "unknown";
    if (!byPlatform[p]) {
      byPlatform[p] = {
        posts: new Set(),
        impressions: 0,
        reach: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      };
    }
    const b = byPlatform[p];
    b.posts.add(r.content_key || r.sns_post_id);
    for (const k of ["impressions", "reach", "views", "likes", "comments", "shares", "saves"]) {
      b[k] += Number(r[k]) || 0;
    }
  }
  for (const p of Object.keys(byPlatform)) {
    byPlatform[p].post_count = byPlatform[p].posts.size;
    delete byPlatform[p].posts;
  }
  return byPlatform;
}

function topPosts(rows, n = 10) {
  return rows
    .map((r) => ({
      ...r,
      eng: ["likes", "comments", "shares", "saves"].reduce(
        (s, k) => s + (Number(r[k]) || 0),
        0
      ),
    }))
    .sort((a, b) => b.eng - a.eng)
    .slice(0, n);
}

function fmtNum(n) {
  return n.toLocaleString("en-US");
}

function buildReport(weekId, range, prevRange, current, previous) {
  const lines = [];
  lines.push(`# SNS Weekly Report — ${weekId}`);
  lines.push("");
  lines.push(`期間: ${range.monday} 〜 ${range.sunday}（前週: ${prevRange.monday} 〜 ${prevRange.sunday}）`);
  lines.push("");

  lines.push(`## プラットフォーム別サマリ`);
  lines.push("");
  lines.push(`| Platform | 投稿数 | Views | Impressions | Reach | Likes | Comments | Shares | Saves |`);
  lines.push(`|---|---:|---:|---:|---:|---:|---:|---:|---:|`);
  for (const [p, s] of Object.entries(current).sort()) {
    const prev = previous[p] || { post_count: 0, views: 0, impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
    const fmt = (curr, pv) => {
      const delta = pv === 0 ? (curr === 0 ? 0 : 100) : ((curr - pv) / pv) * 100;
      const sign = delta >= 0 ? "+" : "";
      const arrow = delta > 5 ? "▲" : delta < -5 ? "▼" : "→";
      return `${fmtNum(curr)} ${arrow}${sign}${delta.toFixed(0)}%`;
    };
    lines.push(
      `| ${p} | ${fmt(s.post_count, prev.post_count)} | ${fmt(s.views, prev.views)} | ${fmt(s.impressions, prev.impressions)} | ${fmt(s.reach, prev.reach)} | ${fmt(s.likes, prev.likes)} | ${fmt(s.comments, prev.comments)} | ${fmt(s.shares, prev.shares)} | ${fmt(s.saves, prev.saves)} |`
    );
  }
  if (Object.keys(current).length === 0) {
    lines.push(`| (no data) | | | | | | | | |`);
  }
  lines.push("");

  return lines.join("\n");
}

function buildTopPostsSection(rows) {
  const lines = [];
  lines.push(`## エンゲージメント上位 10 投稿`);
  lines.push("");
  lines.push(`| Platform | content_key | Eng | Likes | Comments | Shares | Saves |`);
  lines.push(`|---|---|---:|---:|---:|---:|---:|`);
  const top = topPosts(rows, 10);
  if (top.length === 0) {
    lines.push(`| (no data) | | | | | | |`);
  } else {
    for (const r of top) {
      lines.push(
        `| ${r.platform} | ${r.content_key || r.sns_post_id} | ${r.eng} | ${r.likes ?? ""} | ${r.comments ?? ""} | ${r.shares ?? ""} | ${r.saves ?? ""} |`
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const weekId = WEEK_ARG || getPreviousWeekId();
  const range = isoWeekToDates(weekId);
  const prevWeekNum = parseInt(weekId.slice(6), 10) - 1;
  const prevWeekId = `${weekId.slice(0, 4)}-W${String(prevWeekNum).padStart(2, "0")}`;
  const prevRange = isoWeekToDates(prevWeekId);

  const currentRows = store.readByRange(range.monday, range.sunday);
  const prevRows = store.readByRange(prevRange.monday, prevRange.sunday);
  const current = summarize(currentRows);
  const previous = summarize(prevRows);

  const reportData = buildReport(weekId, range, prevRange, current, previous);
  const reportTop = buildTopPostsSection(currentRows);

  const aiPlaceholder = [
    `## 分析・next action`,
    ``,
    `> このセクションは \`/sns-weekly-report ${weekId}\` skill（または週次レビュー Claude Routine）で追記される。`,
    `> 自動生成時点ではデータ部のみ生成。`,
    ``,
  ].join("\n");

  const body = reportData + "\n" + reportTop + "\n" + aiPlaceholder;

  const outDir = path.join(PROJECT_ROOT, "docs/04_レビュー/sns-weekly-report");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${weekId}.md`);

  if (DRY_RUN) {
    console.log(body);
    console.error(`[dry-run] would write to ${outPath}`);
    return;
  }

  // 既存ファイルがあって `## 分析・next action` 以下が AI 編集済みなら、その部分は保持する
  if (existsSync(outPath)) {
    const existing = readFileSync(outPath, "utf-8");
    const m = existing.match(/## 分析・next action[\s\S]*$/);
    if (m && !m[0].includes("このセクションは")) {
      const dataAndTop = reportData + "\n" + reportTop + "\n";
      writeFileSync(outPath, dataAndTop + m[0], "utf-8");
      console.log(`✓ Updated data portion, preserved analysis: ${outPath}`);
      return;
    }
  }

  writeFileSync(outPath, body, "utf-8");
  console.log(`✓ Wrote ${outPath}`);
}

main();
