/**
 * Cloudflare 日次 threshold check
 *
 * 最新 snapshot を budgets-daily.json と照合し、違反があれば exit 1 + report.md 出力。
 * GitHub Actions の if: failure() で Issue 起票するために使う。
 *
 * Usage:
 *   node .claude/scripts/cloudflare/threshold-check.mjs --output /tmp/cf-report.md
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { datasetDir } from "../../../config/datasets.mjs";

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const STATE_DIR = join(PROJECT_ROOT, datasetDir("cloudflare.cost-snapshots"));
const SNAPSHOTS_DIR = join(STATE_DIR, "snapshots");
const BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/config/budgets/cloudflare-cost-improvement/budgets-daily.json",
);
const MONTHLY_BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/config/budgets/cloudflare-cost-improvement/budgets.json",
);

// Workers Paid の料金 (Cloudflare 請求画面 2026-11-13)。基本料 $5、込み分 月 3,000 万 CPU ms、超過 100 万 ms あたり $0.02
export const WORKERS_BASE_USD = 5;
export const WORKERS_INCLUDED_CPU_MS = 30_000_000;
export const WORKERS_OVERAGE_USD_PER_MILLION_MS = 0.02;

/** CPU ms の累計から推定月額 (USD・税別) を出す。 */
export function estimateWorkersCostUsd(cpuMs) {
  return WORKERS_BASE_USD
    + (Math.max(0, cpuMs - WORKERS_INCLUDED_CPU_MS) / 1_000_000) * WORKERS_OVERAGE_USD_PER_MILLION_MS;
}

const DAY_MS = 86_400_000;
const isoOf = (d) => d.toISOString().slice(0, 10);

/** 請求サイクルの開始日 (毎月 15 日)。日が 15 以上ならその月、未満なら前月の 15 日。 */
export function cycleStartDate(latestDate) {
  const [y, m, d] = latestDate.split("-").map(Number);
  return isoOf(new Date(Date.UTC(y, d >= 15 ? m - 1 : m - 2, 15)));
}

/** 開始日から翌月 14 日までの暦日数 (両端込み)。 */
export function cycleLengthDays(startDate) {
  const [y, m] = startDate.split("-").map(Number);
  return Math.round((Date.UTC(y, m, 15) - Date.UTC(y, m - 1, 15)) / DAY_MS);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { output: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output") opts.output = args[++i];
  }
  return opts;
}

function loadLatestSnapshot() {
  const dates = readdirSync(SNAPSHOTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
  if (dates.length === 0) return null;
  const latest = dates[dates.length - 1];
  return JSON.parse(readFileSync(join(SNAPSHOTS_DIR, `${latest}.json`), "utf-8"));
}

function normalizeBucketMetricKey(bucketName) {
  return bucketName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function flatten(snapshot) {
  const errorRate = snapshot.workers.totalRequests > 0
    ? (snapshot.workers.totalErrors / snapshot.workers.totalRequests) * 100
    : 0;
  const metrics = {
    d1_databases: snapshot.d1.databases.length,
    d1_read_queries: snapshot.d1.readQueries,
    d1_rows_read: snapshot.d1.rowsRead,
    d1_write_queries: snapshot.d1.writeQueries,
    d1_rows_written: snapshot.d1.rowsWritten,
    workers_requests: snapshot.workers.totalRequests,
    workers_errors: snapshot.workers.totalErrors,
    workers_error_rate_pct: errorRate,
    workers_subrequests: snapshot.workers.totalSubrequests,
    r2_class_a_ops: snapshot.r2_operations.classA,
    r2_class_b_ops: snapshot.r2_operations.classB,
    r2_egress_mb: snapshot.r2_operations.totalEgressBytes / 1e6,
    r2_storage_gb: snapshot.r2_storage.totalBytes / 1e9,
    r2_objects: snapshot.r2_storage.totalObjects,
  };

  // 取得不能の日 (null / 欠落) はキー自体を入れない。0 と見せない
  if (typeof snapshot.workers.totalCpuTimeUs === "number") {
    metrics.workers_cpu_ms = snapshot.workers.totalCpuTimeUs / 1000;
  }

  for (const [bucketName, storage] of Object.entries(snapshot.r2_storage.byBucket ?? {})) {
    const bucketKey = normalizeBucketMetricKey(bucketName);
    metrics[`r2_bucket_${bucketKey}_storage_gb`] = storage.bytes / 1e9;
    metrics[`r2_bucket_${bucketKey}_objects`] = storage.objects;
  }

  return metrics;
}

function compare(actual, threshold, op) {
  switch (op) {
    case ">": return actual > threshold;
    case ">=": return actual >= threshold;
    case "<": return actual < threshold;
    case "<=": return actual <= threshold;
    case "==": return actual === threshold;
    default: return false;
  }
}

export function evaluateRules(metrics, rules) {
  const violations = [];
  const passed = [];
  for (const rule of rules) {
    const actual = metrics[rule.metric_key];
    if (actual === undefined) {
      if (!rule.required) continue;
      violations.push({
        rule_id: rule.rule_id,
        title: `${rule.title} metric unavailable`,
        metric_key: rule.metric_key,
        actual: null,
        threshold: rule.threshold,
        operator: rule.operator,
        severity: "critical",
        note: `required metric is missing. ${rule.note}`,
      });
      continue;
    }
    const violated = compare(actual, rule.threshold, rule.operator);
    const entry = {
      rule_id: rule.rule_id,
      title: rule.title,
      metric_key: rule.metric_key,
      actual,
      threshold: rule.threshold,
      operator: rule.operator,
      severity: rule.severity,
      note: rule.note,
    };
    if (violated) violations.push(entry);
    else passed.push(entry);
  }
  return { violations, passed };
}

/**
 * 請求サイクル開始日から latestDate までの CPU 累計で、月額の推定額が日割りの許容額を超えるかを見る。
 * snapshots は { date, workers } を持つ日次 snapshot の配列。CPU が null / 欠落の日は数えず missingDays に残す。
 */
export function evaluateCyclePace({ snapshots, latestDate, monthlyBudgetUsd }) {
  const start = cycleStartDate(latestDate);
  const cycleDays = cycleLengthDays(start);
  const elapsedDays = Math.round((Date.parse(latestDate) - Date.parse(start)) / DAY_MS) + 1;
  let cumulativeCpuMs = 0;
  let counted = 0;
  for (const s of snapshots) {
    if (!s.date || s.date < start || s.date > latestDate) continue;
    const us = s.workers?.totalCpuTimeUs;
    if (typeof us === "number") {
      cumulativeCpuMs += us / 1000;
      counted += 1;
    }
  }
  const missingDays = elapsedDays - counted;
  const estimatedUsd = estimateWorkersCostUsd(cumulativeCpuMs);
  // 基本料 $5 は初日から全額かかるので日割りしない。日割りするのは従量分 (月予算 - 基本料) だけ。
  // 月予算ごと日割りすると、CPU が 0 でもサイクル 10 日目まで必ず超過になる。
  const baseUsd = estimateWorkersCostUsd(0);
  const allowedUsd = baseUsd + (Math.max(0, monthlyBudgetUsd - baseUsd) * elapsedDays) / cycleDays;
  const violations = estimatedUsd > allowedUsd
    ? [{
      rule_id: "workers-cpu-cycle-pace",
      title: "Workers CPU 累計が請求サイクルの日割り予算を超過",
      metric_key: "workers_cpu_cycle_estimated_usd",
      actual: estimatedUsd,
      threshold: allowedUsd,
      operator: ">",
      severity: "warning",
      note: `サイクル ${start} 開始。累計 ${Math.round(cumulativeCpuMs).toLocaleString()} ms、経過 ${elapsedDays}/${cycleDays} 日、CPU が null で数えられなかった日 ${missingDays} 日。推定額は基本料 $5 + 超過分、許容額は基本料 $5 + 月予算 $${monthlyBudgetUsd} の従量分の日割り`,
    }]
    : [];
  return { start, cycleDays, elapsedDays, cumulativeCpuMs, missingDays, estimatedUsd, allowedUsd, violations };
}

const fmtVal = (x) => (typeof x === "number" ? x.toLocaleString() : String(x));

export function buildReport({ snapshot, metrics, violations }) {
  const lines = [];
  lines.push(`# Cloudflare Usage Threshold Report — ${snapshot.date}`);
  lines.push("");
  lines.push(`**計測日**: ${snapshot.date} (UTC)  `);
  lines.push(`**計測時刻**: ${snapshot.fetched_at}  `);
  lines.push("");

  const critical = violations.filter((v) => v.severity === "critical");
  const warn = violations.filter((v) => v.severity === "warning");
  const info = violations.filter((v) => v.severity === "info");

  if (critical.length > 0) {
    lines.push("## 🔴 Critical Violations");
    lines.push("");
    for (const v of critical) {
      lines.push(`- **${v.title}**`);
      lines.push(`  - metric=\`${v.metric_key}\` actual=${v.actual} ${v.operator} threshold=${v.threshold}`);
      lines.push(`  - ${v.note}`);
    }
    lines.push("");
  }
  if (warn.length > 0) {
    lines.push("## ⚠️ Warning Violations");
    lines.push("");
    for (const v of warn) {
      lines.push(`- **${v.title}**`);
      lines.push(`  - metric=\`${v.metric_key}\` actual=${fmtVal(v.actual)} ${v.operator} threshold=${fmtVal(v.threshold)}`);
      lines.push(`  - ${v.note}`);
    }
    lines.push("");
  }
  if (info.length > 0) {
    lines.push("## ℹ️ Info");
    lines.push("");
    for (const v of info) {
      lines.push(`- ${v.title}: \`${v.metric_key}\`=${fmtVal(v.actual)}`);
    }
    lines.push("");
  }
  if (violations.length === 0) {
    lines.push("✅ すべての閾値を pass しました。");
    lines.push("");
  }

  lines.push("## 全指標 (snapshot)");
  lines.push("");
  lines.push("| 指標 | 値 |");
  lines.push("|---|---|");
  lines.push(`| D1 databases | ${metrics.d1_databases} |`);
  lines.push(`| D1 read queries | ${metrics.d1_read_queries.toLocaleString()} |`);
  lines.push(`| D1 rows read | ${metrics.d1_rows_read.toLocaleString()} |`);
  lines.push(`| Workers requests | ${metrics.workers_requests.toLocaleString()} |`);
  lines.push(`| Workers CPU ms | ${typeof metrics.workers_cpu_ms === "number" ? Math.round(metrics.workers_cpu_ms).toLocaleString() : "取得不能"} |`);
  lines.push(`| Workers errors | ${metrics.workers_errors} (${metrics.workers_error_rate_pct.toFixed(3)}%) |`);
  lines.push(`| R2 Class A ops | ${metrics.r2_class_a_ops.toLocaleString()} |`);
  lines.push(`| R2 Class B ops | ${metrics.r2_class_b_ops.toLocaleString()} |`);
  lines.push(`| R2 storage | ${metrics.r2_storage_gb.toFixed(2)} GB / ${metrics.r2_objects.toLocaleString()} objects |`);
  lines.push(`| R2 egress | ${metrics.r2_egress_mb.toFixed(0)} MB |`);
  for (const [bucketName, storage] of Object.entries(snapshot.r2_storage.byBucket ?? {})) {
    lines.push(`| R2 bucket: ${bucketName} | ${(storage.bytes / 1e9).toFixed(2)} GB / ${storage.objects.toLocaleString()} objects |`);
  }
  return lines.join("\n") + "\n";
}

function loadCycleSnapshots(latestDate) {
  const start = cycleStartDate(latestDate);
  return readdirSync(SNAPSHOTS_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((d) => d >= start && d <= latestDate)
    .sort()
    .map((d) => ({ ...JSON.parse(readFileSync(join(SNAPSHOTS_DIR, `${d}.json`), "utf-8")), date: d }));
}

function main() {
  const opts = parseArgs();
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    console.error("No snapshots found");
    process.exit(1);
  }
  const budgets = JSON.parse(readFileSync(BUDGETS_PATH, "utf-8"));
  const metrics = flatten(snapshot);

  const { violations } = evaluateRules(metrics, budgets.rules);

  const monthly = JSON.parse(readFileSync(MONTHLY_BUDGETS_PATH, "utf-8"));
  const monthlyBudgetUsd = monthly.budgets.find((b) => b.metric_key === "total_cost_usd_monthly")?.error_threshold;
  if (typeof monthlyBudgetUsd === "number") {
    const pace = evaluateCyclePace({
      snapshots: loadCycleSnapshots(snapshot.date),
      latestDate: snapshot.date,
      monthlyBudgetUsd,
    });
    violations.push(...pace.violations);
  }

  const report = buildReport({ snapshot, metrics, violations });
  if (opts.output) writeFileSync(opts.output, report);
  console.log(report);

  const critical = violations.filter((v) => v.severity === "critical");
  const warn = violations.filter((v) => v.severity === "warning");
  if (critical.length > 0) {
    console.error(`Critical violations: ${critical.length}`);
    process.exit(2);
  }
  if (warn.length > 0) {
    console.error(`Warning violations: ${warn.length}`);
    process.exit(1);
  }
  console.log("✓ All thresholds passed");
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectExecution) main();
