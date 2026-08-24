import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateRules, flatten } from "../../cloudflare/threshold-check.mjs";

const budgets = JSON.parse(readFileSync(new URL(
  "../../../skills/analytics/cloudflare-cost-improvement/reference/budgets-daily.json",
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
