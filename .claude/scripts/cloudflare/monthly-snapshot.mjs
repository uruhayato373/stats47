#!/usr/bin/env node
/**
 * Cloudflare 月次 snapshot — 日次 snapshot を集計して月次 Markdown を docs/ に書き出し。
 *
 * 入力: `.claude/state/metrics/cloudflare/snapshots/YYYY-MM-DD.json`（日次 GraphQL 取得結果）
 * 出力:
 *   - `.claude/skills/analytics/cloudflare-cost-improvement/reference/monthly-snapshots/YYYY-MM.json`
 *   - `docs/04_レビュー/cloudflare-cost/YYYY-MM.md`（人間向け要約、frontmatter 付き）
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
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, ".claude/state/metrics/cloudflare/snapshots");
const MONTHLY_DIR = path.join(PROJECT_ROOT, ".claude/skills/analytics/cloudflare-cost-improvement/reference/monthly-snapshots");
const DOCS_DIR = path.join(PROJECT_ROOT, "docs/04_レビュー/cloudflare-cost");
const BUDGETS_PATH = path.join(PROJECT_ROOT, ".claude/skills/analytics/cloudflare-cost-improvement/reference/budgets.json");

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

function listDailySnapshots(start, end) {
  if (!existsSync(SNAPSHOTS_DIR)) return [];
  return readdirSync(SNAPSHOTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""))
    .filter((d) => d >= start && d <= end)
    .sort();
}

function aggregate(dates) {
  const agg = {
    d1: { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 },
    workers: { totalRequests: 0, totalErrors: 0, totalSubrequests: 0 },
    r2_operations: { classA: 0, classB: 0, otherOps: 0, totalEgressBytes: 0 },
    r2_storage: { latestBytes: 0, latestObjects: 0 },
  };
  for (const date of dates) {
    const p = path.join(SNAPSHOTS_DIR, `${date}.json`);
    if (!existsSync(p)) continue;
    const s = JSON.parse(readFileSync(p, "utf-8"));
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
  const valueOf = {
    d1_rows_read: agg.d1.rowsRead,
    d1_rows_written: agg.d1.rowsWritten,
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

function buildIssueBody(cycle, range, agg, comparisons, prevAgg) {
  const lines = [];
  lines.push(`# [Cloudflare Cost Snapshot] ${cycle}`);
  lines.push("");
  lines.push(`請求サイクル: ${range.start} 〜 ${range.end}`);
  lines.push("");

  lines.push(`## サマリ`);
  lines.push("");
  lines.push(`| 指標 | 当月 | 前月 | 変化 |`);
  lines.push(`|---|---:|---:|---|`);
  const metrics = [
    ["D1 rows read", agg.d1.rowsRead, prevAgg?.d1?.rowsRead],
    ["D1 rows written", agg.d1.rowsWritten, prevAgg?.d1?.rowsWritten],
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
    if (prev !== undefined && prev !== null && prev !== 0) {
      const pct = ((curr - prev) / prev) * 100;
      const sign = pct >= 0 ? "+" : "";
      delta = `${sign}${pct.toFixed(1)}%`;
    }
    lines.push(`| ${name} | ${f(curr)} | ${prev !== undefined && prev !== null ? f(prev) : "—"} | ${delta} |`);
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
  if (errors.length === 0 && warnings.length === 0) {
    lines.push(`- 🟢 全 budget 内。次回請求書到着時に \`/cloudflare-cost-improvement invoice\` で精算検証`);
  }
  lines.push("");
  lines.push(`---`);
  lines.push(`_Auto-generated by \`.claude/scripts/cloudflare/monthly-snapshot.mjs\` (cron: 毎月 15 日 JST 09:00)_`);
  lines.push(`_詳細データ: \`.claude/skills/analytics/cloudflare-cost-improvement/reference/monthly-snapshots/${cycle}.json\`_`);

  return lines.join("\n");
}

function buildDocsMarkdown(cycle, range, agg, comparisons, prevAgg, snapshotBody) {
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
  const comparisons = compareToBudgets(agg);

  // 前月分も集計
  const prevCycle = addMonths(cycle, -1);
  const prevRange = cycleRange(prevCycle);
  const prevDates = listDailySnapshots(prevRange.start, prevRange.end);
  const prevAgg = prevDates.length > 0 ? aggregate(prevDates) : null;

  const snapshot = {
    cycle,
    range,
    generated_at: new Date().toISOString(),
    days_covered: dates.length,
    aggregate: agg,
    previous_cycle: prevCycle,
    previous_aggregate: prevAgg,
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

  const snapshotBody = buildIssueBody(cycle, range, agg, comparisons, prevAgg);
  const docsMarkdown = buildDocsMarkdown(cycle, range, agg, comparisons, prevAgg, snapshotBody);

  if (NO_WRITE || DRY_RUN) {
    console.log("\n--- docs/ markdown preview ---");
    console.log(docsMarkdown);
    return;
  }

  mkdirSync(DOCS_DIR, { recursive: true });
  const docsOut = path.join(DOCS_DIR, `${cycle}.md`);
  if (existsSync(docsOut)) {
    console.log(`Already exists: ${docsOut}. Skip.`);
    return;
  }
  writeFileSync(docsOut, docsMarkdown);
  console.log(`✓ Wrote ${docsOut}`);
}

main();
