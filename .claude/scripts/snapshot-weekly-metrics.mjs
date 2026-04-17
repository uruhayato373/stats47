#!/usr/bin/env node
/**
 * Weekly Metrics Snapshot
 *
 * metrics-reader から週次 NSM メトリクスを取得して
 * docs/03_レビュー/weekly-metrics/YYYY-Www.json に保存する。
 * index.json を追記して時系列トラッキング可能にする。
 *
 * 参照: .claude/scripts/lib/metrics-reader.mjs
 *       .claude/skills/management/nsm-experiment/
 *       .claude/skills/management/weekly-review/SKILL.md (Phase 0)
 *
 * Usage:
 *   node .claude/scripts/snapshot-weekly-metrics.mjs              # 現在の週
 *   node .claude/scripts/snapshot-weekly-metrics.mjs 2026-W16     # 指定週
 *   node .claude/scripts/snapshot-weekly-metrics.mjs --force      # 既存を上書き
 *   node .claude/scripts/snapshot-weekly-metrics.mjs --dry-run    # 書き込まず表示
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  fetchWeeklyNsmMetrics,
  formatNsmSection,
} from "./lib/metrics-reader.mjs";

const OUT_DIR = "docs/03_レビュー/weekly-metrics";
const INDEX_PATH = join(OUT_DIR, "index.json");

// ── ISO 8601 週番号計算 ────────────────────────────────────────

function getIsoWeek(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNum };
}

function formatWeekId({ year, week }) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function parseWeekId(id) {
  const m = /^(\d{4})-W(\d{2})$/.exec(id);
  if (!m) return null;
  return { year: parseInt(m[1], 10), week: parseInt(m[2], 10) };
}

// ── 引数パース ─────────────────────────────────────────────────

function parseArgs() {
  const args = { force: false, dryRun: false, weekId: null };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (/^\d{4}-W\d{2}$/.test(a)) args.weekId = a;
  }
  return args;
}

// ── index.json の更新 ──────────────────────────────────────────

function updateIndex(weekId, snapshotPath) {
  let index = { version: 1, generated_at: null, weeks: [] };
  if (existsSync(INDEX_PATH)) {
    try {
      index = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
    } catch {
      // 壊れていたら再生成
    }
  }
  const existingIdx = index.weeks.findIndex((w) => w.week_id === weekId);
  const entry = {
    week_id: weekId,
    path: snapshotPath.replace(/\\/g, "/"),
    generated_at: new Date().toISOString(),
  };
  if (existingIdx >= 0) index.weeks[existingIdx] = entry;
  else index.weeks.push(entry);
  index.weeks.sort((a, b) => a.week_id.localeCompare(b.week_id));
  index.generated_at = new Date().toISOString();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf-8");
  return index;
}

// ── メイン ──────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const isoWeek = args.weekId ? parseWeekId(args.weekId) : getIsoWeek();
  const weekId = formatWeekId(isoWeek);
  const outPath = join(OUT_DIR, `${weekId}.json`);

  console.log(`[snapshot] 週次メトリクス取得中: ${weekId}`);

  if (existsSync(outPath) && !args.force && !args.dryRun) {
    console.log(
      `[snapshot] ⚠ ${outPath} は既に存在します。上書きするには --force`,
    );
    return;
  }

  const metrics = await fetchWeeklyNsmMetrics();

  if (args.dryRun) {
    console.log("[DRY-RUN] 取得結果:");
    console.log(formatNsmSection(metrics));
    console.log(`\n[DRY-RUN] 保存先 (書き込まず): ${outPath}`);
    return;
  }

  const snapshot = {
    week_id: weekId,
    year: isoWeek.year,
    week: isoWeek.week,
    ...metrics,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
  console.log(`[snapshot] ✓ ${outPath} に保存`);

  const index = updateIndex(weekId, outPath);
  console.log(
    `[snapshot] ✓ index.json 更新 (total ${index.weeks.length} 週分)`,
  );

  if (metrics.ga4?.total) {
    const t = metrics.ga4.total;
    const deltaSign = t.engagedSessionDelta > 0 ? "+" : "";
    console.log(
      `\n  engagedSessions (NSM): ${t.thisEngagedSessions} (前週 ${t.prevEngagedSessions}, delta ${deltaSign}${t.engagedSessionDelta})`,
    );
  }
  if (metrics.gsc?.total) {
    const t = metrics.gsc.total;
    const deltaSign = t.clickDelta > 0 ? "+" : "";
    console.log(
      `  GSC clicks:            ${t.thisClicks} (前週 ${t.prevClicks}, delta ${deltaSign}${t.clickDelta})`,
    );
  }
}

main().catch((e) => {
  console.error("[snapshot] Error:", e.message);
  process.exit(1);
});
