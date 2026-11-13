import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateRules, flatten } from "../../cloudflare/threshold-check.mjs";

const budgets = JSON.parse(readFileSync(new URL(
  "../../../config/budgets/cloudflare-cost-improvement/budgets-daily.json",
  import.meta.url,
), "utf-8"));

function createSnapshot(byBucket) {
  return {
    d1: {
      databases: [],
      readQueries: 0,
      rowsRead: 0,
      writeQueries: 0,
      rowsWritten: 0,
    },
    workers: {
      totalRequests: 100,
      totalErrors: 1,
      totalSubrequests: 2,
    },
    r2_operations: {
      classA: 3,
      classB: 4,
      totalEgressBytes: 5_000_000,
    },
    r2_storage: {
      totalBytes: 22_000_000_000,
      totalObjects: 200,
      byBucket,
    },
  };
}

test("R2容量をアカウント合計とbucket別の独立したmetricへ展開する", () => {
  const snapshot = createSnapshot({
    stats47: { bytes: 11_590_000_000, objects: 120 },
    "doboku-note-archive": { bytes: 8_980_000_000, objects: 80 },
  });

  const metrics = flatten(snapshot);

  assert.equal(metrics.r2_storage_gb, 22);
  assert.equal(metrics.r2_bucket_stats47_storage_gb, 11.59);
  assert.equal(metrics.r2_bucket_stats47_objects, 120);
  assert.equal(metrics.r2_bucket_doboku_note_archive_storage_gb, 8.98);
});

test("bucket内訳が無い古いsnapshotもアカウントmetricを生成できる", () => {
  const snapshot = createSnapshot(undefined);

  const metrics = flatten(snapshot);

  assert.equal(metrics.r2_storage_gb, 22);
  assert.equal(metrics.r2_bucket_stats47_storage_gb, undefined);
});

test("stats47 bucketだけを12.5GB閾値で判定する", () => {
  const rule = budgets.rules.find((candidate) => candidate.rule_id === "r2-stats47-storage-growth");
  assert.ok(rule);

  const below = evaluateRules({ r2_bucket_stats47_storage_gb: 11.59 }, [rule]);
  const above = evaluateRules({ r2_bucket_stats47_storage_gb: 12.51 }, [rule]);
  const missing = evaluateRules({}, [rule]);

  assert.equal(below.violations.length, 0);
  assert.equal(below.passed.length, 1);
  assert.equal(above.violations.length, 1);
  assert.equal(above.violations[0].rule_id, "r2-stats47-storage-growth");
  assert.equal(missing.violations.length, 1);
  assert.equal(missing.violations[0].severity, "critical");
});


// ---- Workers CPU (2026-11-13) ----
import {
  buildReport,
  cycleLengthDays,
  cycleStartDate,
  estimateWorkersCostUsd,
  evaluateCyclePace,
} from "../../cloudflare/threshold-check.mjs";

test("flatten は CPU を ms で含み、null なら workers_cpu_ms キー自体を入れない", () => {
  const withCpu = createSnapshot(undefined);
  withCpu.workers.totalCpuTimeUs = 50_000_000_000;
  assert.equal(flatten(withCpu).workers_cpu_ms, 50_000_000);

  const nullCpu = createSnapshot(undefined);
  nullCpu.workers.totalCpuTimeUs = null;
  assert.equal("workers_cpu_ms" in flatten(nullCpu), false);
  assert.equal("workers_cpu_ms" in flatten(createSnapshot(undefined)), false);
});

test("CPU ルール: 通過・warning・critical と、metric 欠落は critical", () => {
  const rules = budgets.rules.filter((r) => r.metric_key === "workers_cpu_ms");
  assert.deepEqual(rules.map((r) => r.rule_id), ["workers-cpu-warning", "workers-cpu-critical"]);

  assert.equal(evaluateRules({ workers_cpu_ms: 40_000_000 }, rules).violations.length, 0);
  const warn = evaluateRules({ workers_cpu_ms: 50_000_000 }, rules).violations;
  assert.deepEqual(warn.map((v) => [v.rule_id, v.severity]), [["workers-cpu-warning", "warning"]]);
  const crit = evaluateRules({ workers_cpu_ms: 90_000_000 }, rules).violations;
  assert.deepEqual(crit.map((v) => v.severity).sort(), ["critical", "warning"]);
  const missing = evaluateRules({}, rules).violations;
  assert.equal(missing.length, 2);
  assert.ok(missing.every((v) => v.severity === "critical"));
});

test("mutation: 閾値を動かすと CPU 判定が変わる", () => {
  const rules = budgets.rules.filter((r) => r.rule_id === "workers-cpu-warning");
  const metrics = { workers_cpu_ms: 50_000_000 };
  assert.equal(evaluateRules(metrics, rules).violations.length, 1);
  const raised = rules.map((r) => ({ ...r, threshold: 60_000_000 }));
  assert.equal(evaluateRules(metrics, raised).violations.length, 0);
  const lowered = rules.map((r) => ({ ...r, threshold: 10_000_000 }));
  assert.equal(evaluateRules({ workers_cpu_ms: 20_000_000 }, lowered).violations.length, 1);
});

test("サイクル開始日: 14 日は前月 15 日、15 日はその月、月またぎ・年またぎ", () => {
  assert.equal(cycleStartDate("2026-11-14"), "2026-10-15");
  assert.equal(cycleStartDate("2026-11-15"), "2026-11-15");
  assert.equal(cycleStartDate("2026-11-13"), "2026-10-15");
  assert.equal(cycleStartDate("2027-01-10"), "2026-12-15");
  assert.equal(cycleStartDate("2026-12-31"), "2026-12-15");
  assert.equal(cycleLengthDays("2026-10-15"), 31);
  assert.equal(cycleLengthDays("2026-11-15"), 30);
  assert.equal(cycleLengthDays("2026-12-15"), 31);
  assert.equal(cycleLengthDays("2027-01-15"), 31);
  assert.equal(cycleLengthDays("2027-02-15"), 28);
});

test("推定額は基本料 $5 + 込み分 3,000 万 ms 超過分", () => {
  assert.equal(estimateWorkersCostUsd(20_000_000), 5);
  assert.ok(Math.abs(estimateWorkersCostUsd(1_530_000_000) - 35) < 1e-9);
});

function daySnap(date, cpuMs) {
  return { date, workers: { totalCpuTimeUs: cpuMs === null ? null : cpuMs * 1000 } };
}

test("累計ペース: 日割り許容額を超えれば warning を 1 件、超えなければ 0 件", () => {
  // CPU が込み分の範囲ならサイクル初日でも超過にしない (基本料は日割りしない)
  assert.equal(
    evaluateCyclePace({ snapshots: [daySnap("2026-10-15", 900_000)], latestDate: "2026-10-15", monthlyBudgetUsd: 15 }).violations.length,
    0,
  );

  // 10/15〜10/24 (10 日) 各 1 億 ms = 10 億 ms → 5 + 970*0.02 = 24.4。許容 5 + 10*10/31 = 8.23
  const over = [];
  for (let d = 15; d <= 24; d++) over.push(daySnap(`2026-10-${d}`, 100_000_000));
  const r = evaluateCyclePace({ snapshots: over, latestDate: "2026-10-24", monthlyBudgetUsd: 15 });
  assert.equal(r.violations.length, 1);
  assert.equal(r.violations[0].rule_id, "workers-cpu-cycle-pace");
  assert.equal(r.violations[0].severity, "warning");
  assert.ok(Math.abs(r.violations[0].actual - 24.4) < 1e-9);
  assert.match(r.violations[0].note, /経過 10\/31 日/);
  assert.equal(r.elapsedDays, 10);

  // 10 日 各 2,000 万 ms = 2 億 → 5 + 170*0.02 = 8.4 > 8.23 → 超過。予算を 30 にすれば許容 13.06 で非超過
  const mid = [];
  for (let d = 15; d <= 24; d++) mid.push(daySnap(`2026-10-${d}`, 20_000_000));
  assert.equal(evaluateCyclePace({ snapshots: mid, latestDate: "2026-10-24", monthlyBudgetUsd: 15 }).violations.length, 1);
  assert.equal(evaluateCyclePace({ snapshots: mid, latestDate: "2026-10-24", monthlyBudgetUsd: 30 }).violations.length, 0);
});

test("累計ペース: サイクル外の日は数えず、CPU null の日は missingDays に残す", () => {
  const snaps = [
    daySnap("2026-10-14", 999_000_000), // 前サイクル
    daySnap("2026-10-15", 10_000_000),
    daySnap("2026-10-16", null),
    daySnap("2026-10-17", 10_000_000),
  ];
  const r = evaluateCyclePace({ snapshots: snaps, latestDate: "2026-10-17", monthlyBudgetUsd: 100 });
  assert.equal(r.cumulativeCpuMs, 20_000_000);
  assert.equal(r.missingDays, 1);
  assert.equal(r.violations.length, 0);
});

test("info の violation と required な info ルールでも報告生成は落ちない", () => {
  const info = budgets.rules.filter((r) => r.severity === "info" && r.metric_key.startsWith("r2_"));
  assert.ok(info.some((r) => r.rule_id === "r2-storage-growth"));
  assert.ok(info.some((r) => r.rule_id === "r2-stats47-storage-growth" && r.required === true));

  const snap = createSnapshot({ stats47: { bytes: 13_000_000_000, objects: 1 } });
  snap.date = "2026-11-13";
  snap.fetched_at = "x";
  const metrics = flatten(snap);
  const { violations } = evaluateRules(metrics, info);
  assert.equal(violations.length, 2);
  assert.ok(violations.every((v) => v.severity === "info"));
  const report = buildReport({ snapshot: snap, metrics, violations });
  assert.match(report, /## ℹ️ Info/);
  assert.match(report, /Workers CPU ms \| 取得不能/);

  // required な info の metric 欠落は従来どおり critical
  const missing = evaluateRules({}, info).violations;
  assert.equal(missing.length, 1);
  assert.equal(missing[0].severity, "critical");
  assert.doesNotThrow(() => buildReport({ snapshot: snap, metrics, violations: missing }));
});
