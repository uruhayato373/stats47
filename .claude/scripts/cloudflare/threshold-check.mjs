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

const PROJECT_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..", "..", "..");
const STATE_DIR = join(PROJECT_ROOT, ".claude/state/metrics/cloudflare");
const SNAPSHOTS_DIR = join(STATE_DIR, "snapshots");
const BUDGETS_PATH = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json",
);

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
      lines.push(`  - metric=\`${v.metric_key}\` actual=${v.actual.toLocaleString()} ${v.operator} threshold=${v.threshold.toLocaleString()}`);
      lines.push(`  - ${v.note}`);
    }
    lines.push("");
  }
  if (info.length > 0) {
    lines.push("## ℹ️ Info");
    lines.push("");
    for (const v of info) {
      lines.push(`- ${v.title}: \`${v.metric_key}\`=${v.actual.toLocaleString()}`);
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
  lines.push(`| Workers errors | ${metrics.workers_errors} (${metrics.workers_error_rate_pct.toFixed(3)}%) |`);
  lines.push(`| R2 Class A ops | ${metrics.r2_class_a_ops.toLocaleString()} |`);
  lines.push(`| R2 Class B ops | ${metrics.r2_class_b_ops.toLocaleString()} |`);
  lines.push(`| R2 storage | ${metrics.r2_storage_gb.toFixed(2)} GB / ${metrics.r2_objects.toLocaleString()} objects |`);
  lines.push(`| R2 egress | ${metrics.r2_egress_mb.toFixed(0)} MB |`);
  for (const [bucketName, storage] of Object.entries(snapshot.r2_storage.byBucket ?? {})) {
    lines.push(`| R2 bucket: ${bucketName} | ${(storage.bytes / 1e9).toFixed(2)} GB / ${storage.objects.toLocaleString()} objects |`);
  }

  const report = lines.join("\n") + "\n";
  if (opts.output) writeFileSync(opts.output, report);
  console.log(report);

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
