#!/usr/bin/env node
/**
 * Cloudflare 月次 snapshot — 日次 snapshot を集計してskill referenceへ保存。
 *
 * 入力: `data/cloudflare/snapshots/YYYY-MM-DD.json`（日次 GraphQL 取得結果）
 * 出力:
 *   - `data/cloudflare/monthly-snapshots/YYYY-MM.json`
 *   - `data/cloudflare/monthly-snapshots/YYYY-MM.md`
 *
 * 集計対象: 「請求月」= 前月の 15 日から当月の 14 日（Cloudflare の請求サイクル）
 *   - 当 script が JST 09:00 of 15th に走るので、当月の請求サイクルが直前で締まる想定
 *   - 例: 2026-05-15 に走ると 2026-04-15 〜 2026-05-14 を「2026-04 cycle」として集計
 *
 * Usage:
 *   node .claude/scripts/cloudflare/monthly-snapshot.mjs              # 直近の請求サイクル
 *   node .claude/scripts/cloudflare/monthly-snapshot.mjs --cycle 2026-04
 *   node .claude/scripts/cloudflare/monthly-snapshot.mjs --dry-run
 *   node .claude/scripts/cloudflare/monthly-snapshot.mjs --no-write   # JSON のみ書く（Markdown スキップ）
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { datasetDir } from "../../../config/datasets.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, datasetDir("cloudflare.snapshots"));
const MONTHLY_DIR = path.join(PROJECT_ROOT, `${datasetDir("cloudflare.cost-snapshots")}/monthly-snapshots`);
const REPORTS_DIR = MONTHLY_DIR;
const BUDGETS_PATH = path.join(PROJECT_ROOT, ".claude/config/budgets/cloudflare-cost-improvement/budgets.json");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const NO_WRITE = args.includes("--no-write") || args.includes("--no-issue");
const CYCLE_ARG = (() => {
  const i = args.indexOf("--cycle");
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function addMonths(yyyymm, n) {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCurrentCycle() {
  // 「直近で締まった請求サイクル」を返す。当月の 15 日以降に走るなら前月扱い。
  const today = new Date();
  const day = today.getUTCDate();
  const yyyy = today.getUTCFullYear();
  const mm = today.getUTCMonth() + 1;
  const cycleStartMonth = day >= 15
    ? `${yyyy}-${String(mm - 1 || 12).padStart(2, "0")}`
    : addMonths(`${yyyy}-${String(mm).padStart(2, "0")}`, -2);
  return cycleStartMonth.endsWith("-00") ? `${yyyy - 1}-12` : cycleStartMonth;
}

function cycleRange(cycleStart) {
  // cycle "2026-04" = 2026-04-15 〜 2026-05-14
  const [y, m] = cycleStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 15)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(y, m, 14)).toISOString().slice(0, 10);
  return { start, end };
}

// 比較・予算判定に使ってよい日次の網羅率。日次 snapshot は取得翌日に作られるので、
// 実行時点で請求期間の最終日が欠けるのは正常 (30 日中 29 日)。
export const MIN_COVERAGE_RATIO = 0.9;

export function daysInRange({ start, end }) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

export function isCoverageComplete(daysCovered, daysExpected) {
  return daysExpected > 0 && daysCovered / daysExpected >= MIN_COVERAGE_RATIO;
}

function listDailySnapshots(start, end) {
  if (!existsSync(SNAPSHOTS_DIR)) return [];
  return readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .filter((d) => d >= start && d <= end)
    .sort();
}

function readDailySnapshots(dates) {
  return dates
    .map((date) => path.join(SNAPSHOTS_DIR, `${date}.json`))
    .filter((p) => existsSync(p))
    .map((p) => JSON.parse(readFileSync(p, "utf-8")));
}

function readMonthlySnapshot(cycle) {
  const p = path.join(MONTHLY_DIR, `${cycle}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : null;
}

/**
 * 前月の比較元を決める。日次 snapshot は保持 30 件 (prune-state-snapshots.mjs) なので、
 * 15 日の実行時点で前月の日次はほぼ消えている。日次が揃わなければ前月の月次 JSON を使い、
 * どちらも揃わなければ比較しない (欠けた日数の合計と 1 か月分を比べない)。
 */
export function resolvePreviousAggregate({ prevCycle, prevSnapshots, prevDaysExpected, prevMonthly }) {
  if (isCoverageComplete(prevSnapshots.length, prevDaysExpected)) {
    return { aggregate: aggregateSnapshots(prevSnapshots), source: "daily", daysCovered: prevSnapshots.length };
  }
  const monthlyDays = prevMonthly?.days_covered ?? 0;
  if (prevMonthly?.aggregate && isCoverageComplete(monthlyDays, prevDaysExpected)) {
    return { aggregate: prevMonthly.aggregate, source: "monthly", daysCovered: monthlyDays };
  }
  return {
    aggregate: null,
    source: "none",
    daysCovered: Math.max(prevSnapshots.length, monthlyDays),
    reason: `前月 (${prevCycle}) の日次 snapshot が ${prevSnapshots.length}/${prevDaysExpected} 日分で、`
      + (prevMonthly ? `月次 JSON も ${monthlyDays} 日分しか無い` : "月次 JSON も無い"),
  };
}

function aggregate(dates) {
  return aggregateSnapshots(readDailySnapshots(dates));
}

export function aggregateSnapshots(snapshots) {
  const agg = {
    d1: { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 },
    // totalCpuTimeUs は全日分の CPU 合計が揃ったときだけ数値。1 日でも欠ければ null (部分和を合計と見せない)
    workers: { totalRequests: 0, totalErrors: 0, totalSubrequests: 0, totalCpuTimeUs: null, cpuDaysCovered: 0 },
    r2_operations: { classA: 0, classB: 0, otherOps: 0, totalEgressBytes: 0 },
    r2_storage: { latestBytes: 0, latestObjects: 0 },
  };
  let cpuSum = 0;
  for (const s of snapshots) {
    if (typeof s.workers?.totalCpuTimeUs === "number") {
      cpuSum += s.workers.totalCpuTimeUs;
      agg.workers.cpuDaysCovered += 1;
    }
    if (s.d1) {
      agg.d1.readQueries += s.d1.readQueries || 0;
      agg.d1.writeQueries += s.d1.writeQueries || 0;
      agg.d1.rowsRead += s.d1.rowsRead || 0;
      agg.d1.rowsWritten += s.d1.rowsWritten || 0;
    }
    if (s.workers) {
      agg.workers.totalRequests += s.workers.totalRequests || 0;
      agg.workers.totalErrors += s.workers.totalErrors || 0;
      agg.workers.totalSubrequests += s.workers.totalSubrequests || 0;
    }
    if (s.r2_operations) {
      agg.r2_operations.classA += s.r2_operations.classA || 0;
      agg.r2_operations.classB += s.r2_operations.classB || 0;
      agg.r2_operations.otherOps += s.r2_operations.otherOps || 0;
      agg.r2_operations.totalEgressBytes += s.r2_operations.totalEgressBytes || 0;
    }
    if (s.r2_storage) {
      agg.r2_storage.latestBytes = s.r2_storage.totalBytes || agg.r2_storage.latestBytes;
      agg.r2_storage.latestObjects = s.r2_storage.totalObjects || agg.r2_storage.latestObjects;
    }
  }
  if (snapshots.length > 0 && agg.workers.cpuDaysCovered === snapshots.length) {
    agg.workers.totalCpuTimeUs = cpuSum;
  }
  return agg;
}

function fmtNum(n) {
  if (typeof n !== "number") return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function fmtBytes(n) {
  if (!n) return "0B";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}TB`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}MB`;
  return `${n}B`;
}

function compareToBudgets(agg) {
  if (!existsSync(BUDGETS_PATH)) return [];
  const { budgets } = JSON.parse(readFileSync(BUDGETS_PATH, "utf-8"));
  return evaluateBudgets(budgets, agg);
}

export function evaluateBudgets(budgets, agg) {
  const cpuUs = agg.workers.totalCpuTimeUs;
  const valueOf = {
    d1_rows_read: agg.d1.rowsRead,
    d1_rows_written: agg.d1.rowsWritten,
    workers_cpu_ms: typeof cpuUs === "number" ? cpuUs / 1000 : null,
    workers_requests: agg.workers.totalRequests,
    r2_class_a_operations: agg.r2_operations.classA,
    r2_class_b_operations: agg.r2_operations.classB,
    r2_storage_bytes: agg.r2_storage.latestBytes,
  };
  return budgets.map((b) => {
    const actual = valueOf[b.metric_key] ?? null;
    const status = actual === null ? "unknown"
      : actual >= b.error_threshold ? "error"
      : actual >= b.warning_threshold ? "warning"
      : "ok";
    return { ...b, actual, status };
  });
}

export function buildIssueBody(cycle, range, agg, comparisons, previous, coverage) {
  const prevAgg = previous?.aggregate ?? null;
  const cpuMs = (a) => (typeof a?.workers?.totalCpuTimeUs === "number" ? a.workers.totalCpuTimeUs / 1000 : null);
  const lines = [];
  lines.push(`# [Cloudflare Cost Snapshot] ${cycle}`);
  lines.push("");
  lines.push(`請求サイクル: ${range.start} 〜 ${range.end} (日次 snapshot ${coverage.daysCovered}/${coverage.daysExpected} 日分)`);
  lines.push("");

  lines.push(`## サマリ`);
  lines.push("");
  lines.push(`| 指標 | 当月 | 前月 | 変化 |`);
  lines.push(`|---|---:|---:|---|`);
  const metrics = [
    ["D1 rows read", agg.d1.rowsRead, prevAgg?.d1?.rowsRead],
    ["D1 rows written", agg.d1.rowsWritten, prevAgg?.d1?.rowsWritten],
    ["Workers CPU ms", cpuMs(agg), cpuMs(prevAgg)],
    ["Workers requests", agg.workers.totalRequests, prevAgg?.workers?.totalRequests],
    ["R2 Class A ops", agg.r2_operations.classA, prevAgg?.r2_operations?.classA],
    ["R2 Class B ops", agg.r2_operations.classB, prevAgg?.r2_operations?.classB],
    ["R2 egress", agg.r2_operations.totalEgressBytes, prevAgg?.r2_operations?.totalEgressBytes],
    ["R2 storage", agg.r2_storage.latestBytes, prevAgg?.r2_storage?.latestBytes],
  ];
  for (const [name, curr, prev] of metrics) {
    const isBytes = /egress|storage/.test(name);
    const f = isBytes ? fmtBytes : fmtNum;
    let delta = "—";
    if (typeof curr === "number" && typeof prev === "number" && prev !== 0) {
      const pct = ((curr - prev) / prev) * 100;
      const sign = pct >= 0 ? "+" : "";
      delta = `${sign}${pct.toFixed(1)}%`;
    }
    lines.push(`| ${name} | ${f(curr)} | ${typeof prev === "number" ? f(prev) : "—"} | ${delta} |`);
  }
  lines.push("");
  if (!coverage.complete) {
    lines.push(`> 当月の日次 snapshot が ${coverage.daysCovered}/${coverage.daysExpected} 日分しか無いため、合計は 1 か月分ではない。`);
  }
  if (previous?.source === "monthly") {
    lines.push(`> 前月の値は前月の月次 JSON (${previous.daysCovered} 日分) から。前月の日次 snapshot は保持期間を過ぎている。`);
  } else if (previous?.source === "none") {
    lines.push(`> 前月比を出さない: ${previous.reason}。`);
  }
  if (cpuMs(agg) === null) {
    lines.push(`> Workers CPU ms: 日次 snapshot の CPU 合計が ${agg.workers.cpuDaysCovered}/${coverage.daysCovered} 日分しか無いため集計しない。請求書の CPU 行が唯一の出典 (\`/cloudflare-cost-improvement invoice\`)。`);
  }
  lines.push("");

  lines.push(`## Budget 対比`);
  lines.push("");
  lines.push(`| Metric | 実績 | Warning 閾値 | Error 閾値 | Status |`);
  lines.push(`|---|---:|---:|---:|---|`);
  for (const c of comparisons) {
    const isBytes = c.metric_key.includes("bytes");
    const f = isBytes ? fmtBytes : fmtNum;
    const icon = c.status === "error" ? "🔴" : c.status === "warning" ? "🟡" : c.status === "ok" ? "🟢" : "⚪";
    lines.push(`| ${c.metric_key} | ${f(c.actual)} | ${f(c.warning_threshold)} | ${f(c.error_threshold)} | ${icon} ${c.status} |`);
  }
  lines.push("");

  lines.push(`## 次のアクション`);
  lines.push("");
  const errors = comparisons.filter((c) => c.status === "error");
  const warnings = comparisons.filter((c) => c.status === "warning");
  if (errors.length > 0) {
    lines.push(`- 🔴 **超過**: ${errors.map((c) => c.metric_key).join(", ")} — \`/cloudflare-cost-improvement invoice\` で原因切り分け`);
  }
  if (warnings.length > 0) {
    lines.push(`- 🟡 **警告**: ${warnings.map((c) => c.metric_key).join(", ")} — 月次トレンドを監視`);
  }
  const unknowns = comparisons.filter((c) => c.status === "unknown");
  if (unknowns.length > 0) {
    lines.push(`- ⚪ **未判定**: ${unknowns.map((c) => c.metric_key).join(", ")} — 日次 snapshot で取れないため、請求書で \`/cloudflare-cost-improvement invoice\` を実行して判定`);
  }
  if (errors.length === 0 && warnings.length === 0 && unknowns.length === 0) {
    lines.push(`- 🟢 全 budget 内。次回請求書到着時に \`/cloudflare-cost-improvement invoice\` で精算検証`);
  }
  lines.push("");
  lines.push(`---`);
  lines.push(`_Auto-generated by \`.claude/scripts/cloudflare/monthly-snapshot.mjs\` (cron: 毎月 15 日 JST 09:00)_`);
  lines.push(`_詳細データ: \`${datasetDir("cloudflare.cost-snapshots")}/monthly-snapshots/${cycle}.json\`_`);

  return lines.join("\n");
}

function buildReportMarkdown(cycle, range, comparisons, snapshotBody) {
  const lines = [];
  lines.push("---");
  lines.push(`type: cloudflare-cost-snapshot`);
  lines.push(`month: ${cycle}`);
  lines.push(`period_start: ${range.start}`);
  lines.push(`period_end: ${range.end}`);
  lines.push(`generated_at: ${new Date().toISOString().slice(0, 10)}`);
  const hasError = comparisons.some((c) => c.status === "error");
  const hasWarn = comparisons.some((c) => c.status === "warning");
  lines.push(`status: ${hasError ? "error" : hasWarn ? "warning" : "ok"}`);
  lines.push("---");
  lines.push("");
  lines.push(snapshotBody);
  return lines.join("\n");
}

function main() {
  const cycle = CYCLE_ARG || getCurrentCycle();
  const range = cycleRange(cycle);
  const dates = listDailySnapshots(range.start, range.end);

  if (dates.length === 0) {
    console.error(`No daily snapshots found in ${range.start} 〜 ${range.end}`);
    process.exit(1);
  }

  const agg = aggregate(dates);
  const daysExpected = daysInRange(range);
  const coverage = { daysCovered: dates.length, daysExpected, complete: isCoverageComplete(dates.length, daysExpected) };
  // 当月の日次が欠けている月は予算判定もしない (部分和を ok と誤判定しない)
  const comparisons = coverage.complete
    ? compareToBudgets(agg)
    : compareToBudgets(agg).map((c) => ({ ...c, actual: null, status: "unknown" }));

  const prevCycle = addMonths(cycle, -1);
  const prevRange = cycleRange(prevCycle);
  const previous = resolvePreviousAggregate({
    prevCycle,
    prevSnapshots: readDailySnapshots(listDailySnapshots(prevRange.start, prevRange.end)),
    prevDaysExpected: daysInRange(prevRange),
    prevMonthly: readMonthlySnapshot(prevCycle),
  });

  const snapshot = {
    cycle,
    range,
    generated_at: new Date().toISOString(),
    days_covered: dates.length,
    days_expected: daysExpected,
    aggregate: agg,
    previous_cycle: prevCycle,
    previous_source: previous.source,
    previous_days_covered: previous.daysCovered,
    previous_aggregate: previous.aggregate,
    budget_comparisons: comparisons,
  };

  if (!DRY_RUN) {
    mkdirSync(MONTHLY_DIR, { recursive: true });
    const out = path.join(MONTHLY_DIR, `${cycle}.json`);
    writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
    console.log(`✓ Wrote ${out}`);
  } else {
    console.log(`[dry-run] Would write ${cycle}.json`);
    console.log(JSON.stringify(snapshot, null, 2));
  }

  const snapshotBody = buildIssueBody(cycle, range, agg, comparisons, previous, coverage);
  const reportMarkdown = buildReportMarkdown(cycle, range, comparisons, snapshotBody);

  if (NO_WRITE || DRY_RUN) {
    console.log("\n--- report markdown preview ---");
    console.log(reportMarkdown);
    return;
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportOut = path.join(REPORTS_DIR, `${cycle}.md`);
  if (existsSync(reportOut)) {
    console.log(`Already exists: ${reportOut}. Skip.`);
    return;
  }
  writeFileSync(reportOut, reportMarkdown);
  console.log(`✓ Wrote ${reportOut}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
