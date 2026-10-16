import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateSnapshots,
  buildIssueBody,
  daysInRange,
  evaluateBudgets,
  resolvePreviousAggregate,
} from "../../cloudflare/monthly-snapshot.mjs";

function daily(requests, cpuUs) {
  return {
    d1: { readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 },
    workers: { totalRequests: requests, totalErrors: 0, totalSubrequests: 0, ...(cpuUs === undefined ? {} : { totalCpuTimeUs: cpuUs }) },
    r2_operations: { classA: 0, classB: 0, otherOps: 0, totalEgressBytes: 0 },
    r2_storage: { totalBytes: 1, totalObjects: 1 },
  };
}

const range = { start: "2026-09-15", end: "2026-10-14" };
const coverage = { daysCovered: 29, daysExpected: 30, complete: true };

test("請求期間の日数を両端込みで数える", () => {
  assert.equal(daysInRange(range), 30);
  assert.equal(daysInRange({ start: "2026-01-15", end: "2026-02-14" }), 31);
});

// 2026-09 のレポートで 30 日分 (2.98M) と保持期間に残った 1 日分 (94.3K) を比べ +3060% と出した不具合の再発防止
test("前月の日次が 1 日分しか無く月次 JSON も無ければ前月比を出さない", () => {
  const previous = resolvePreviousAggregate({
    prevCycle: "2026-08",
    prevSnapshots: [daily(94_328)],
    prevDaysExpected: 31,
    prevMonthly: null,
  });
  assert.equal(previous.source, "none");
  assert.equal(previous.aggregate, null);

  const body = buildIssueBody("2026-09", range, aggregateSnapshots([daily(2_980_977)]), [], previous, coverage);
  assert.match(body, /\| Workers requests \| 2\.98M \| — \| — \|/);
  assert.doesNotMatch(body, /\+3060/);
  assert.match(body, /前月比を出さない: 前月 \(2026-08\) の日次 snapshot が 1\/31 日分/);
});

test("前月の日次が欠けていれば前月の月次 JSON を比較元にする", () => {
  const previous = resolvePreviousAggregate({
    prevCycle: "2026-08",
    prevSnapshots: [daily(94_328)],
    prevDaysExpected: 31,
    prevMonthly: { days_covered: 29, aggregate: aggregateSnapshots([daily(2_079_648)]) },
  });
  assert.equal(previous.source, "monthly");

  const body = buildIssueBody("2026-09", range, aggregateSnapshots([daily(2_980_977)]), [], previous, coverage);
  assert.match(body, /\| Workers requests \| 2\.98M \| 2\.08M \| \+43\.3% \|/);
});

test("前月の月次 JSON 自体が数日分しか無ければ比較元にしない", () => {
  const previous = resolvePreviousAggregate({
    prevCycle: "2026-08",
    prevSnapshots: [],
    prevDaysExpected: 31,
    prevMonthly: { days_covered: 3, aggregate: aggregateSnapshots([daily(300_000)]) },
  });
  assert.equal(previous.source, "none");
});

test("CPU 合計は全日分そろったときだけ数値にし、欠ければ予算判定を unknown にする", () => {
  const budgets = [{ metric_key: "workers_cpu_ms", warning_threshold: 25_000_000, error_threshold: 30_000_000 }];

  const full = aggregateSnapshots([daily(10, 20_000_000_000), daily(10, 20_000_000_000)]);
  assert.equal(full.workers.totalCpuTimeUs, 40_000_000_000);
  assert.deepEqual(evaluateBudgets(budgets, full).map((c) => [c.actual, c.status]), [[40_000_000, "error"]]);

  // 旧形式の日次 (CPU 項目なし) が 1 日混じれば部分和を合計と見せない
  const partial = aggregateSnapshots([daily(10, 20_000_000_000), daily(10)]);
  assert.equal(partial.workers.totalCpuTimeUs, null);
  assert.equal(partial.workers.cpuDaysCovered, 1);
  assert.deepEqual(evaluateBudgets(budgets, partial).map((c) => c.status), ["unknown"]);

  const body = buildIssueBody("2026-09", range, partial, [], { source: "none", reason: "x" }, coverage);
  assert.match(body, /Workers CPU ms: 日次 snapshot の CPU 合計が 1\/29 日分/);
});
