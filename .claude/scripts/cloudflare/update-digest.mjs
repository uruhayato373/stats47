/**
 * Cloudflare 日次 digest 更新スクリプト
 *
 * .claude/state/metrics/cloudflare/snapshots/YYYY-MM-DD.json を読み、
 * 以下を更新する:
 *   - .claude/state/metrics/cloudflare/history.csv : 日次 append-only 履歴
 *   - .claude/state/metrics/cloudflare/LATEST.md   : 人間向け最新サマリ + 前日比
 *
 * Usage:
 *   node .claude/scripts/cloudflare/update-digest.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/cloudflare");
const SNAPSHOTS_DIR = join(STATE_DIR, "snapshots");
const HISTORY_CSV = join(STATE_DIR, "history.csv");
const LATEST_MD = join(STATE_DIR, "LATEST.md");

const HEADER = "date,d1_databases,d1_read_queries,d1_rows_read,d1_write_queries,d1_rows_written,workers_requests,workers_errors,workers_subrequests,r2_class_a_ops,r2_class_b_ops,r2_egress_mb,r2_storage_gb,r2_objects";

function loadSnapshot(date) {
  const p = join(SNAPSHOTS_DIR, `${date}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

function listSnapshotDates() {
  if (!existsSync(SNAPSHOTS_DIR)) return [];
  return readdirSync(SNAPSHOTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

function toCsvRow(s) {
  return [
    s.date,
    s.d1.databases.length,
    s.d1.readQueries,
    s.d1.rowsRead,
    s.d1.writeQueries,
    s.d1.rowsWritten,
    s.workers.totalRequests,
    s.workers.totalErrors,
    s.workers.totalSubrequests,
    s.r2_operations.classA,
    s.r2_operations.classB,
    Math.round(s.r2_operations.totalEgressBytes / 1e6),
    (s.r2_storage.totalBytes / 1e9).toFixed(3),
    s.r2_storage.totalObjects,
  ].join(",");
}

function loadHistory() {
  if (!existsSync(HISTORY_CSV)) return [];
  const lines = readFileSync(HISTORY_CSV, "utf-8").split("\n").filter(Boolean);
  return lines.slice(1); // skip header
}

function rebuildHistory() {
  const dates = listSnapshotDates();
  const rows = [HEADER];
  for (const d of dates) {
    const s = loadSnapshot(d);
    if (s) rows.push(toCsvRow(s));
  }
  writeFileSync(HISTORY_CSV, rows.join("\n") + "\n");
}

function arrow(today, yesterday, lowerIsBetter = true) {
  if (today === yesterday || yesterday === 0) return "→";
  const diff = today - yesterday;
  const pct = yesterday === 0 ? 0 : (diff / yesterday) * 100;
  const dir = diff > 0 ? "▲" : "▼";
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const tag = better ? "✅" : (Math.abs(pct) > 30 ? "⚠️" : "");
  return `${dir} ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% ${tag}`;
}

function fmt(n, unit = "") {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B${unit}`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M${unit}`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K${unit}`;
  return `${n}${unit}`;
}

function writeLatest() {
  const dates = listSnapshotDates();
  if (dates.length === 0) {
    writeFileSync(LATEST_MD, "# Cloudflare Usage\n\nNo snapshots yet.\n");
    return;
  }
  const latest = loadSnapshot(dates[dates.length - 1]);
  const prev = dates.length >= 2 ? loadSnapshot(dates[dates.length - 2]) : null;

  const lines = [];
  lines.push(`# Cloudflare Usage — ${latest.date}`);
  lines.push("");
  lines.push(`> 計測時刻: ${latest.fetched_at}`);
  lines.push(`> 前日比: ${prev ? prev.date : "なし（初回）"}`);
  lines.push("");

  // D1
  lines.push("## D1");
  lines.push("");
  lines.push("| 指標 | 当日 | 前日比 |");
  lines.push("|---|---|---|");
  lines.push(`| Databases (active) | ${latest.d1.databases.length} | ${prev ? arrow(latest.d1.databases.length, prev.d1.databases.length) : "—"} |`);
  lines.push(`| Read queries | ${fmt(latest.d1.readQueries)} | ${prev ? arrow(latest.d1.readQueries, prev.d1.readQueries) : "—"} |`);
  lines.push(`| Rows read | ${fmt(latest.d1.rowsRead)} | ${prev ? arrow(latest.d1.rowsRead, prev.d1.rowsRead) : "—"} |`);
  lines.push(`| Write queries | ${fmt(latest.d1.writeQueries)} | ${prev ? arrow(latest.d1.writeQueries, prev.d1.writeQueries) : "—"} |`);
  lines.push(`| Rows written | ${fmt(latest.d1.rowsWritten)} | ${prev ? arrow(latest.d1.rowsWritten, prev.d1.rowsWritten) : "—"} |`);
  lines.push("");
  if (latest.d1.databases.length > 0) {
    lines.push(`**⚠️ D1 database が検出されています**: ${latest.d1.databases.join(", ")}`);
    lines.push("");
    lines.push("Phase 10 で削除済のはずです。新規作成された場合は意図を確認してください。");
    lines.push("");
  }

  // Workers
  lines.push("## Workers");
  lines.push("");
  lines.push("| 指標 | 当日 | 前日比 |");
  lines.push("|---|---|---|");
  lines.push(`| Requests | ${fmt(latest.workers.totalRequests)} | ${prev ? arrow(latest.workers.totalRequests, prev.workers.totalRequests, false) : "—"} |`);
  lines.push(`| Errors | ${latest.workers.totalErrors} | ${prev ? arrow(latest.workers.totalErrors, prev.workers.totalErrors) : "—"} |`);
  lines.push(`| Subrequests | ${fmt(latest.workers.totalSubrequests)} | ${prev ? arrow(latest.workers.totalSubrequests, prev.workers.totalSubrequests) : "—"} |`);
  lines.push("");
  const errorRate = latest.workers.totalRequests > 0
    ? (latest.workers.totalErrors / latest.workers.totalRequests * 100).toFixed(2)
    : "0.00";
  lines.push(`**Error rate**: ${errorRate}% (${latest.workers.totalErrors}/${latest.workers.totalRequests})`);
  lines.push("");

  // R2
  lines.push("## R2");
  lines.push("");
  lines.push("| 指標 | 当日 | 前日比 |");
  lines.push("|---|---|---|");
  lines.push(`| Class A ops (writes) | ${fmt(latest.r2_operations.classA)} | ${prev ? arrow(latest.r2_operations.classA, prev.r2_operations.classA) : "—"} |`);
  lines.push(`| Class B ops (reads) | ${fmt(latest.r2_operations.classB)} | ${prev ? arrow(latest.r2_operations.classB, prev.r2_operations.classB) : "—"} |`);
  lines.push(`| Egress | ${(latest.r2_operations.totalEgressBytes / 1e6).toFixed(0)}MB | ${prev ? arrow(latest.r2_operations.totalEgressBytes, prev.r2_operations.totalEgressBytes) : "—"} |`);
  lines.push(`| Storage | ${(latest.r2_storage.totalBytes / 1e9).toFixed(2)}GB | ${prev ? arrow(latest.r2_storage.totalBytes, prev.r2_storage.totalBytes) : "—"} |`);
  lines.push(`| Objects | ${latest.r2_storage.totalObjects.toLocaleString()} | ${prev ? arrow(latest.r2_storage.totalObjects, prev.r2_storage.totalObjects, false) : "—"} |`);
  lines.push("");

  // Bucket breakdown
  lines.push("### Bucket breakdown");
  lines.push("");
  lines.push("| Bucket | Storage (GB) | Objects | Class A | Class B | Egress (MB) |");
  lines.push("|---|---|---|---|---|---|");
  for (const [bucket, stor] of Object.entries(latest.r2_storage.byBucket)) {
    const ops = latest.r2_operations.byBucket[bucket] || { classA: 0, classB: 0, egressBytes: 0 };
    lines.push(`| ${bucket} | ${(stor.bytes / 1e9).toFixed(2)} | ${stor.objects.toLocaleString()} | ${fmt(ops.classA)} | ${fmt(ops.classB)} | ${(ops.egressBytes / 1e6).toFixed(0)} |`);
  }
  lines.push("");

  lines.push("## History");
  lines.push("");
  lines.push("Last 7 days (`.claude/state/metrics/cloudflare/history.csv`):");
  lines.push("");
  lines.push("```");
  const hist = loadHistory();
  lines.push(HEADER);
  for (const row of hist.slice(-7)) lines.push(row);
  lines.push("```");

  writeFileSync(LATEST_MD, lines.join("\n") + "\n");
}

function main() {
  rebuildHistory();
  writeLatest();
  console.log(`✅ Updated ${HISTORY_CSV}`);
  console.log(`✅ Updated ${LATEST_MD}`);
}

main();
