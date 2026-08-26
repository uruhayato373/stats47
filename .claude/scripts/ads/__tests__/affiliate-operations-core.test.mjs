import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateVariantMetrics,
  buildOperationsState,
  evaluateExperiments,
  evaluateMeasurementGate,
  evaluatePublishGate,
  validateOperationsState,
} from "../lib/affiliate-operations-core.mjs";

const NOW = "2026-07-15T00:00:00.000Z";

function freshGa4(overrides = {}) {
  // schema v2 (doc 42 §10.1)。v2 必須フィールドを欠くと gate が blocked になる。
  return {
    schemaVersion: 2,
    measurementEpoch: "affiliate-impression-v1",
    eventNames: { impression: "affiliate_impression", click: "affiliate_click" },
    generatedAt: "2026-07-12T13:00:00.000Z",
    hasVerticalBreakdown: true,
    hasVariantBreakdown: true,
    totals: { impressions: 100, clicks: 1, ctr: 0.01 },
    quality: { recognizedVerticalImpressions: 95, unsetVerticalImpressions: 5, unsetVerticalRatio: 0.05 },
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

test("gate v2: 旧 schema snapshot は値が新鮮でも blocked(ga4-schema-unsupported)", () => {
  // 2026-07-26 実データ形 (schemaVersion 無し・imp 13,115 が AdSense 汚染) の再現
  const legacy = freshGa4();
  delete legacy.schemaVersion;
  delete legacy.measurementEpoch;
  delete legacy.eventNames;
  delete legacy.quality;
  const gate = evaluateMeasurementGate({ ga4: legacy, inventory: freshInventory(), nowIso: NOW });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.some((r) => r.startsWith("ga4-schema-unsupported")));
});

test("gate v2: impression 0 → blocked(ga4-impressions-zero)", () => {
  const gate = evaluateMeasurementGate({
    ga4: freshGa4({
      totals: { impressions: 0, clicks: 0, ctr: null },
      quality: { recognizedVerticalImpressions: 0, unsetVerticalImpressions: 0, unsetVerticalRatio: null },
    }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.includes("ga4-impressions-zero"));
});

test("gate v2: 認識済み vertical の impression 0 → blocked(ga4-recognized-vertical-zero)", () => {
  const gate = evaluateMeasurementGate({
    ga4: freshGa4({
      quality: { recognizedVerticalImpressions: 0, unsetVerticalImpressions: 100, unsetVerticalRatio: 1 },
    }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.includes("ga4-recognized-vertical-zero"));
});

test("gate v2: (unset) vertical 比率 > 0.10 → blocked(ratio-high)", () => {
  const gate = evaluateMeasurementGate({
    ga4: freshGa4({
      quality: { recognizedVerticalImpressions: 80, unsetVerticalImpressions: 20, unsetVerticalRatio: 0.2 },
    }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.equal(gate.status, "blocked");
  assert.ok(gate.reasons.some((r) => r.startsWith("ga4-unset-vertical-ratio-high")));
});

test("gate v2: epoch / impression event 名の不一致 → blocked", () => {
  const wrongEpoch = evaluateMeasurementGate({
    ga4: freshGa4({ measurementEpoch: "ad-impression-v0" }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.ok(wrongEpoch.reasons.some((r) => r.startsWith("ga4-epoch-mismatch")));
  const wrongEvent = evaluateMeasurementGate({
    ga4: freshGa4({ eventNames: { impression: "ad_impression", click: "affiliate_click" } }),
    inventory: freshInventory(),
    nowIso: NOW,
  });
  assert.ok(wrongEvent.reasons.some((r) => r.startsWith("ga4-impression-event-mismatch")));
});

test("publish gate: missingDisclosure / orphaned が 1 件以上で blocked (doc 42 §10.3)", () => {
  const clean = evaluatePublishGate({
    compliance: { directPlacements: { total: 2, orphaned: [], missingDisclosure: [] } },
  });
  assert.equal(clean.status, "ready");
  const dirty = evaluatePublishGate({
    compliance: {
      directPlacements: {
        total: 2,
        orphaned: [],
        missingDisclosure: [{ id: "moshimo-ai-onikanri-93995", missing: ["head-pr-declaration"] }],
      },
    },
  });
  assert.equal(dirty.status, "blocked");
  assert.ok(dirty.reasons.includes("missing-disclosure:moshimo-ai-onikanri-93995"));
  const missing = evaluatePublishGate({ compliance: null });
  assert.equal(missing.status, "blocked");
  assert.ok(missing.reasons.includes("compliance-snapshot-missing"));
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
  assert.ok(result.active[0].decisionGuards.includes("insufficient-sample"));
});

test("実験: measurement gate blocked / confound は sample 到達後も ready にしない", () => {
  const result = evaluateExperiments({
    registry: [registryEntry({ confounds: ["same-slot-change"] })],
    ads: ssotVariants(),
    variantMetrics: [
      { experimentId: "exp1", variantId: "A", impressions: 1500, clicks: 30, ctr: 0.02 },
      { experimentId: "exp1", variantId: "B", impressions: 1200, clicks: 12, ctr: 0.01 },
    ],
    nowIso: NOW,
    measurementGate: { status: "blocked", reasons: ["ga4-snapshot-stale"] },
  });
  assert.equal(result.readyToDecide.length, 0);
  assert.deepEqual(result.active[0].decisionGuards, ["measurement-gate-blocked", "confounded"]);
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
    schemaVersion: 1,
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

// ─── kind: "code" のコード駆動 A/B (2026-08-04 新設) ────────────────
//   variant の実体が広告エントリではなくコード側の分岐にある実験。
//   配分は決定的ハッシュで weight を持たないため、SSOT variant 検査は構造的に通らない。
//   registry の variantIds を正として扱えることを固定する。

function codeRegistryEntry(overrides = {}) {
  return {
    experimentId: "blog-inbody-format",
    kind: "code",
    status: "collecting",
    variantIds: ["text", "banner"],
    startedAt: "2026-06-01", // NOW から 44 日経過
    minSamplePerVariant: 500,
    minDurationDays: 14,
    maxDurationDays: 56,
    ...overrides,
  };
}

test("code 実験: SSOT に variant が無くても invalid にならない", () => {
  const result = evaluateExperiments({
    registry: [codeRegistryEntry()],
    ads: [], // コード駆動なので affiliate-ads-data.ts に variant は存在しない
    variantMetrics: [
      { experimentId: "blog-inbody-format", variantId: "text", impressions: 900, clicks: 4, ctr: 0.0044 },
      { experimentId: "blog-inbody-format", variantId: "banner", impressions: 800, clicks: 9, ctr: 0.011 },
    ],
    nowIso: NOW,
  });
  assert.equal(result.invalid.length, 0, "SSOT variant 検査を code 実験に適用してはいけない");
  assert.equal(result.readyToDecide.length, 1);
  assert.equal(result.readyToDecide[0].kind, "code");
});

test("code 実験: variantIds が 2 未満なら invalid", () => {
  const result = evaluateExperiments({
    registry: [codeRegistryEntry({ variantIds: ["text"] })],
    ads: [],
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.equal(result.invalid.length, 1);
  assert.ok(result.invalid[0].reasons.some((r) => r.includes("registry-variants-insufficient")));
});

test("code 実験: sample 未到達なら collecting (期間だけでは決めない)", () => {
  const result = evaluateExperiments({
    registry: [codeRegistryEntry()],
    ads: [],
    variantMetrics: [
      { experimentId: "blog-inbody-format", variantId: "text", impressions: 100, clicks: 1, ctr: 0.01 },
      { experimentId: "blog-inbody-format", variantId: "banner", impressions: 90, clicks: 2, ctr: 0.022 },
    ],
    nowIso: NOW,
  });
  assert.equal(result.active.length, 1);
  assert.equal(result.active[0].status, "collecting");
});

test("creative 実験は従来どおり SSOT variant を検査する (回帰防止)", () => {
  const result = evaluateExperiments({
    registry: [registryEntry()],
    ads: [], // SSOT に variant が無い → invalid のまま
    variantMetrics: [],
    nowIso: NOW,
  });
  assert.equal(result.invalid.length, 1);
  assert.ok(result.invalid[0].reasons.some((r) => r.includes("ssot-variants-insufficient")));
});
