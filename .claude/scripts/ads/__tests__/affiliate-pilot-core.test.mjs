import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAffiliatePilotState,
  estimateAffiliatePilotFeasibility,
  evaluateAffiliatePilotReadiness,
  evaluateAffiliatePilotVerdict,
  validateAffiliatePilotState,
} from "../lib/affiliate-pilot-core.mjs";

const plan = {
  programRef: "a8:s00000000000001",
  pagePath: "/ranking/example",
  pageType: "ranking",
  variantIds: ["discovery", "decision"],
  primaryMetric: "confirmed-revenue-per-1000-viewable-impressions",
  minImpressionsPerVariant: 1000,
  minClicksPerVariant: 10,
  minDurationDays: 28,
  maxDurationDays: 84,
  outcomeMaturityDays: 30,
  riskVertical: "education",
  riskLevel: "low",
  personalDataLevel: "none",
  reusesExistingPlacement: true,
  addsMobilePlacement: false,
  ctaCount: 1,
};
const readyPortfolio = { gates: { pilot: { status: "ready", reasons: [] } } };

test("必要clickを含め最大期間内のpilot実現可能性を事前計算する", () => {
  const result = estimateAffiliatePilotFeasibility({
    baselineImpressions: 12020,
    baselineClicks: 30,
    baselineWindowDays: 28,
    variantCount: 2,
    minImpressionsPerVariant: 1000,
    minClicksPerVariant: 10,
    maxDurationDays: 84,
  });
  assert.equal(result.status, "feasible");
  assert.equal(result.requiredClicks, 20);
  assert.ok(result.projectedDays <= 84);
});

test("現行の低click率では最大期間超過をnot-feasibleにする", () => {
  const result = estimateAffiliatePilotFeasibility({
    baselineImpressions: 12020,
    baselineClicks: 3,
    baselineWindowDays: 28,
    variantCount: 2,
    minImpressionsPerVariant: 1000,
    minClicksPerVariant: 10,
    maxDurationDays: 84,
  });
  assert.equal(result.status, "not-feasible");
  assert.ok(result.projectedDays > 84);
});

test("owner承認・既存実験・portfolio gateを開始前にfail-closedする", () => {
  const readiness = evaluateAffiliatePilotReadiness({
    portfolio: { gates: { pilot: { status: "blocked", reasons: ["outcome-blocked"] } } },
    plan,
    activeExperiments: [{ experimentId: "existing" }],
    ownerApprovals: {},
    feasibility: { status: "feasible", reasons: [] },
  });
  assert.equal(readiness.status, "blocked");
  assert.ok(readiness.reasons.includes("existing-affiliate-experiment-active"));
  assert.ok(readiness.reasons.includes("owner-approval-missing:push"));
  assert.ok(readiness.reasons.includes("outcome-blocked"));
});

test("sensitive/high-riskや追加mobile枠を初回pilotから除外する", () => {
  const readiness = evaluateAffiliatePilotReadiness({
    portfolio: readyPortfolio,
    plan: { ...plan, personalDataLevel: "sensitive", addsMobilePlacement: true },
    ownerApprovals: { offer: true, page: true, push: true },
    feasibility: { status: "feasible", reasons: [] },
  });
  assert.equal(readiness.status, "blocked");
  assert.ok(readiness.reasons.includes("pilot-risk-excluded"));
  assert.ok(readiness.reasons.includes("pilot-ux-guard-failed"));
});

test("sample・期間・成果成熟後も勝者を自動選択せず比較だけ返す", () => {
  const verdict = evaluateAffiliatePilotVerdict({
    plan,
    readiness: { status: "ready", reasons: [] },
    nowIso: "2026-10-01T00:00:00.000Z",
    observation: {
      startedAt: "2026-08-01T00:00:00.000Z",
      confounds: [],
      variants: [
        { variantId: "discovery", impressions: 1200, clicks: 12, confirmedRevenueYen: 600, outcomesMature: true },
        { variantId: "decision", impressions: 1100, clicks: 11, confirmedRevenueYen: 900, outcomesMature: true },
      ],
    },
  });
  assert.equal(verdict.status, "ready-to-present");
  assert.equal(verdict.winnerVariantId, null);
  assert.equal(verdict.comparison.length, 2);
});

test("最大期間到達時のsample不足はinconclusiveになる", () => {
  const verdict = evaluateAffiliatePilotVerdict({
    plan,
    readiness: { status: "ready", reasons: [] },
    nowIso: "2026-11-01T00:00:00.000Z",
    observation: {
      startedAt: "2026-08-01T00:00:00.000Z",
      confounds: [],
      variants: [
        { variantId: "discovery", impressions: 100, clicks: 1, confirmedRevenueYen: 0, outcomesMature: true },
        { variantId: "decision", impressions: 100, clicks: 1, confirmedRevenueYen: 0, outcomesMature: true },
      ],
    },
  });
  assert.equal(verdict.status, "inconclusive");
  assert.equal(verdict.winnerVariantId, null);
});

test("現行gateから生成したstateは次の一手を1件だけ持つ", () => {
  const state = buildAffiliatePilotState({
    nowIso: "2026-08-28T00:00:00.000Z",
    portfolio: { gates: { pilot: { status: "blocked", reasons: ["measurement-blocked"] } } },
    plan: null,
    activeExperiments: [{ experimentId: "existing" }],
    ownerApprovals: {},
    feasibility: null,
    observation: null,
  });
  assert.equal(state.recommendedAction.id, "resolve-pilot-start-gates");
  assert.deepEqual(validateAffiliatePilotState(state), []);
});
