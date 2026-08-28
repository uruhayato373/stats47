import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAffiliatePortfolioState,
  evaluateAffiliatePortfolioFreshness,
  validateAffiliatePortfolioState,
} from "../lib/affiliate-portfolio-core.mjs";

const profile = {
  programRef: "a8:s00000000000001",
  vertical: "education",
  allowedVerticals: ["education"],
  lane: "discovery",
  actionType: "download",
  frictionTier: "F1",
  conversionCondition: "download complete",
  personalDataLevel: "none",
  humanContact: "none",
  conditionSource: "https://example.test/terms",
  verifiedAt: "2026-08-28",
  portfolioStatus: "pilot-ready",
  allowedPageTypes: ["ranking"],
};
const ad = {
  id: "ad-1",
  programRef: profile.programRef,
  vertical: "education",
  locationCode: "blog-bottom",
  isActive: true,
  targetRankingKeys: null,
};
const ga4 = {
  schemaVersion: 3,
  generatedAt: "2026-08-28T00:00:00.000Z",
  overview: [{ ad_id: "ad-1", impressions: 1000, clicks: 10 }],
  experiments: [],
  pages: [{ pagePath: "/ranking/school", impressions: 1000, clicks: 10 }],
};
const ready = { status: "ready", reasons: [] };

function build(overrides = {}) {
  return buildAffiliatePortfolioState({
    nowIso: "2026-08-28T12:00:00.000Z",
    ads: [ad],
    profiles: [profile],
    ga4,
    ga4Path: "ga4.json",
    measurementGate: ready,
    a8Results: {
      updatedAt: "2026-08-28T00:00:00.000Z",
      records: [{ month: "2026-08", programRef: profile.programRef, clicks: 3, conversions: 2, approved: 1, revenueYen: 500 }],
    },
    a8ResultsPath: "a8.json",
    outcomeGate: ready,
    sharedProgramRefs: [],
    activeExperiments: [],
    ...overrides,
  });
}

test("GA4広告別CTRと確定収益/1000 viewable impを同時に生成する", () => {
  const state = build();
  assert.equal(state.offers[0].metrics.ctr.value, 0.01);
  assert.equal(state.offers[0].metrics.confirmedRevenueYen.value, 500);
  assert.equal(state.offers[0].metrics.confirmedRevenuePer1000ViewableImpressions.value, 500);
  assert.deepEqual(validateAffiliatePortfolioState(state), []);
});

test("shared account program をstats47単独の確定収益へ誤配賦しない mutation gate", () => {
  const state = build({ sharedProgramRefs: [profile.programRef] });
  assert.equal(state.offers[0].metrics.confirmedRevenueYen.value, null);
  assert.equal(state.offers[0].metrics.confirmedRevenueYen.unavailableReason, "a8-shared-account-program");
  assert.equal(state.gates.portfolio.status, "blocked");
  assert.deepEqual(validateAffiliatePortfolioState(state), []);
});

test("旧GA4 schemaは数値を0へ丸めず欠損理由を残す", () => {
  const state = build({ ga4: { schemaVersion: 2, generatedAt: ga4.generatedAt, rows: [] } });
  assert.equal(state.offers[0].metrics.impressions.value, null);
  assert.match(state.offers[0].metrics.impressions.unavailableReason, /ga4-schema-unsupported/);
  assert.equal(state.gates.measurement.status, "blocked");
});

test("null metricに理由が無いstateをvalidatorが拒否する", () => {
  const state = build();
  state.offers[0].metrics.confirmedRevenueYen = { value: null, unavailableReason: null };
  assert.ok(validateAffiliatePortfolioState(state).some((error) => error.startsWith("metric-null-without-reason")));
});

test("active experimentがあればpilot gateだけをblockedにする", () => {
  const state = build({ activeExperiments: [{ experimentId: "other" }] });
  assert.equal(state.gates.portfolio.status, "ready");
  assert.equal(state.gates.pilot.status, "blocked");
  assert.ok(state.gates.pilot.reasons.includes("existing-affiliate-experiment-active"));
});

test("discoveryだけでは二層比較を開始せずpilot gateをblockedにする", () => {
  const state = build();
  assert.equal(state.gates.portfolio.status, "ready");
  assert.equal(state.gates.pilot.status, "blocked");
  assert.ok(state.gates.pilot.reasons.includes("eligible-lane-pair-missing"));
});

test("portfolio stateの欠損・10日超過をworkflow healthで検出する", () => {
  assert.equal(evaluateAffiliatePortfolioFreshness(null, "2026-08-28T00:00:00Z").status, "blocked");
  const stale = evaluateAffiliatePortfolioFreshness(
    { generatedAt: "2026-08-01T00:00:00Z" },
    "2026-08-28T00:00:00Z",
  );
  assert.equal(stale.status, "blocked");
  assert.equal(stale.ageDays, 27);
  assert.equal(
    evaluateAffiliatePortfolioFreshness({ generatedAt: "2026-08-27T00:00:00Z" }, "2026-08-28T00:00:00Z").status,
    "ready",
  );
});

test("queue stateは除外profile本体を重複保存せず理由件数へ畳む", () => {
  const state = build({ profiles: [{ ...profile, portfolioStatus: "pending-classification", lane: "unknown" }] });
  const queue = state.queueContexts[0].ranking;
  assert.equal(queue.excluded.count, 1);
  assert.equal(queue.excluded.byReason["offer-profile-unclassified"], 1);
  assert.equal("profile" in queue.excluded, false);
});

test("未分類profileは可視化するが、別の有効候補までportfolio gateで止めない", () => {
  const pending = {
    ...profile,
    programRef: "a8:s00000000000002",
    lane: "unknown",
    actionType: "unknown",
    frictionTier: "unknown",
    conversionCondition: null,
    personalDataLevel: "unknown",
    humanContact: "unknown",
    conditionSource: null,
    verifiedAt: null,
    portfolioStatus: "pending-classification",
    allowedPageTypes: [],
  };
  const state = build({ profiles: [profile, pending] });
  assert.equal(state.gates.coverage.status, "blocked");
  assert.ok(state.gates.coverage.reasons.includes("offer-profile-unclassified:1"));
  assert.equal(state.gates.portfolio.status, "ready");
});
