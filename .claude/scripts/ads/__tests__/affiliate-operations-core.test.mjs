import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateVariantMetrics,
  buildOperationsState,
  evaluateExperiments,
  evaluateMeasurementGate,
  validateOperationsState,
} from "../lib/affiliate-operations-core.mjs";

const NOW = "2026-07-15T00:00:00.000Z";

function freshGa4(overrides = {}) {
  return {
    generatedAt: "2026-07-12T13:00:00.000Z",
    hasVerticalBreakdown: true,
    hasVariantBreakdown: true,
    totals: { impressions: 100, clicks: 1, ctr: 0.01 },
    rows: [],
    ...overrides,
  };
}

function freshInventory(overrides = {}) {
  return {
    generatedAt: "2026-07-13T22:00:00.000Z",
    coverage: { gapVerticals: [], thinVerticals: ["furusato"] },
    ...overrides,
  };
}

test("gate: 新鮮な snapshot + dimension 登録済み → ready", () => {
  const gate = evaluateMeasurementGate({ ga4: freshGa4(), inventory: freshInventory(), nowIso: NOW });
  assert.equal(gate.status, "ready");
  assert.deepEqual(gate.reasons, []);
  assert.equal(gate.freshness.ga4Days, 2);
  assert.equal(gate.freshness.inventoryDays, 1);
});

test("gate: GA4 snapshot 欠落 → blocked(ga4-snapshot-missing)", () => {
  const gate = evaluateMeasurementGate({ ga4: null, inventory: freshInventory(), nowIso: NOW });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.includes("ga4-snapshot-missing"));
});

test("gate: 古い GA4 snapshot → blocked(stale)", () => {
  const gate = evaluateMeasurementGate({
    ga4: freshGa4({ generatedAt: "2026-06-01T00:00:00.000Z" }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.some((r) => r.startsWith("ga4-snapshot-stale")));
});

test("gate: vertical dimension 未登録 → blocked / variant は実験中のみ要求", () => {
  const noVertical = evaluateMeasurementGate({
    ga4: freshGa4({ hasVerticalBreakdown: false }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.ok(noVertical.reasons.includes("ga4-vertical-dimension-missing"));

  const noVariantIdle = evaluateMeasurementGate({
    ga4: freshGa4({ hasVariantBreakdown: false }),
    inventory: freshInventory(),
    nowIso: NOW,
    hasActiveExperiments: false,
  });
  assert.equal(noVariantIdle.status, "ready");

  const noVariantActive = evaluateMeasurementGate({
    ga4: freshGa4({ hasVariantBreakdown: false }),
    inventory: freshInventory(),
    nowIso: NOW,
    hasActiveExperiments: true,
  });
  assert.ok(noVariantActive.reasons.includes("ga4-variant-dimension-missing"));
});

test("variant 集計: (experiment, variant) 別に imp/click/CTR を合算", () => {
  const rows = [
    { experiment_id: "exp1", variant_id: "A", impressions: 500, clicks: 5 },
    { experiment_id: "exp1", variant_id: "A", impressions: 500, clicks: 5 },
    { experiment_id: "exp1", variant_id: "B", impressions: 1000, clicks: 5 },
    { experiment_id: "(unset)", variant_id: "(unset)", impressions: 99, clicks: 9 },
  ];
  const metrics = aggregateVariantMetrics(rows);
  assert.equal(metrics.length, 2);
  const a = metrics.find((m) => m.variantId === "A");
  assert.equal(a.impressions, 1000);
  assert.equal(a.ctr, 0.01);
});

// 実験 fixture: SSOT variant 2 件 + registry 1 件
function ssotVariants(overrides = []) {
  const base = [
    { id: "ad1", experimentId: "exp1", variantId: "A", weight: 1, locationCode: "sidebar-bottom", isActive: true },
    { id: "ad2", experimentId: "exp1", variantId: "B", weight: 1, locationCode: "sidebar-bottom", isActive: true },
  ];
  return base.map((b, i) => ({ ...b, ...(overrides[i] ?? {}) }));
}

function registryEntry(overrides = {}) {
  return {
    experimentId: "exp1",
    targetLocation: "sidebar-bottom",
    variantIds: ["A", "B"],
    startedAt: "2026-06-01",
    minSamplePerVariant: 1000,
    minDurationDays: 28,
    maxDurationDays: 84,
    primaryMetric: "ctr",
    status: "active",
    ...overrides,
  };
}

test("実験: sample+期間到達 → ready-to-decide (自動反映はしない=提示のみ)", () => {
  const result = evaluateExperiments({
    registry: [registryEntry()],
    ads: ssotVariants(),
    variantMetrics: [
      { experimentId: "exp1", variantId: "A", impressions: 1500, clicks: 30, ctr: 0.02 },
      { experimentId: "exp1", variantId: "B", impressions: 1200, clicks: 12, ctr: 0.01 },
    ],
    nowIso: NOW, // 44 日経過
  });
  assert.equal(result.readyToDecide.length, 1);
  assert.equal(result.readyToDecide[0].status, "ready-to-decide");
  assert.equal(result.readyToDecide[0].sampleReached, true);
  assert.equal(result.active.length, 0);
});

test("実験: sample 未到達 → collecting", () => {
  const result = evaluateExperiments({
    registry: [registryEntry()],
    ads: ssotVariants(),
    variantMetrics: [
      { experimentId: "exp1", variantId: "A", impressions: 100, clicks: 1, ctr: 0.01 },
    ],
    nowIso: NOW,
  });
  assert.equal(result.active.length, 1);
  assert.equal(result.active[0].status, "collecting");
});

test("実験: 最大期間到達でも sample 未到達 → inconclusive", () => {
  const result = evaluateExperiments({
    registry: [registryEntry({ startedAt: "2026-03-01" })], // 136 日経過 > max 84
    ads: ssotVariants(),
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.equal(result.inconclusive.length, 1);
  assert.equal(result.inconclusive[0].status, "inconclusive");
});

test("実験: variant 重複 / weight 不正 / 対象枠不一致 / registry 欠落 → invalid", () => {
  // variantId 重複
  let result = evaluateExperiments({
    registry: [registryEntry()],
    ads: ssotVariants([{}, { variantId: "A" }]),
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.ok(result.invalid[0].reasons.some((r) => r.includes("variant-id-duplicate")));

  // weight 不正
  result = evaluateExperiments({
    registry: [registryEntry()],
    ads: ssotVariants([{ weight: 0 }]),
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.ok(result.invalid[0].reasons.some((r) => r.startsWith("weight-invalid")));

  // 対象枠不一致
  result = evaluateExperiments({
    registry: [registryEntry()],
    ads: ssotVariants([{ locationCode: "blog-bottom" }]),
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.ok(result.invalid[0].reasons.some((r) => r.startsWith("target-location-mismatch")));

  // SSOT に experimentId があるが registry 未登録
  result = evaluateExperiments({
    registry: [],
    ads: ssotVariants(),
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.deepEqual(result.invalid[0].reasons, ["registry-missing"]);
});

test("実験: closed は closed に分類され再評価しない", () => {
  const result = evaluateExperiments({
    registry: [registryEntry({ status: "closed", winnerVariantId: "A" })],
    ads: [],
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.equal(result.closed.length, 1);
  assert.equal(result.closed[0].winnerVariantId, "A");
  assert.equal(result.invalid.length, 0);
});

test("state 組立: schema validate を通り、blocked 時は recommendedActions 先頭が gate 修正", () => {
  const gate = evaluateMeasurementGate({ ga4: null, inventory: freshInventory(), nowIso: NOW });
  const experiments = evaluateExperiments({ registry: [], ads: [], variantMetrics: [], nowIso: NOW });
  const state = buildOperationsState({
    nowIso: NOW,
    inventory: freshInventory({ coverage: { gapVerticals: ["education"], thinVerticals: [] } }),
    inventoryPath: ".claude/state/ads/inventory-latest.json",
    ga4: null,
    ga4Path: null,
    compliance: { directPlacements: { total: 2, orphaned: [], missingDisclosure: [] } },
    experiments,
    measurementGate: gate,
  });
  assert.deepEqual(validateOperationsState(state), []);
  assert.equal(state.measurementGate.status, "blocked");
  assert.equal(state.recommendedActions[0].id, "fix-measurement-gate");
  assert.ok(state.recommendedActions.some((a) => a.id === "propose-partnership"));
});

test("state validate: 壊れた state を検出 (blocked なのに reasons 空 / schemaVersion 不一致)", () => {
  const errors = validateOperationsState({
    schemaVersion: 2,
    generatedAt: "not-a-date",
    measurementGate: { status: "blocked", reasons: [] },
    freshness: {},
    coverage: { gapVerticals: [], thinVerticals: [] },
    directPlacements: { total: 0, orphaned: [], missingDisclosure: [] },
    experiments: { active: [], readyToDecide: [], invalid: [] },
    recommendedActions: [],
  });
  assert.ok(errors.some((e) => e.includes("schemaVersion")));
  assert.ok(errors.some((e) => e.includes("generatedAt")));
  assert.ok(errors.some((e) => e.includes("reasons が空")));
  assert.ok(errors.some((e) => e.includes("freshness")));
});
