import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAffiliateOfferQueues,
  deriveAffiliateProgramRefs,
  isNormalAffiliateAd,
  validateAffiliateOfferProfiles,
} from "../lib/affiliate-offer-core.mjs";

const verticals = ["education", "economy"];

function profile(overrides = {}) {
  return {
    programRef: "a8:s00000000000001",
    vertical: "education",
    allowedVerticals: ["education"],
    lane: "discovery",
    actionType: "download",
    frictionTier: "F1",
    conversionCondition: "資料のダウンロード完了",
    personalDataLevel: "none",
    humanContact: "none",
    conditionSource: "https://example.test/condition",
    verifiedAt: "2026-08-28",
    portfolioStatus: "pilot-ready",
    allowedPageTypes: ["ranking"],
    ...overrides,
  };
}

function ad(overrides = {}) {
  return {
    id: "ad-1",
    programRef: "a8:s00000000000001",
    vertical: "education",
    isActive: true,
    targetRankingKeys: null,
    ...overrides,
  };
}

test("programRef は mid と同じ a8mat program token から text creative へ継承する", () => {
  const result = deriveAffiliateProgramRefs([
    {
      id: "banner",
      htmlContent: "https://px.a8.net/?a8mat=AAA+TOKEN+CCC",
      imageUrl: "https://a8.net/bgt?mid=s00000012345678010000",
    },
    { id: "text", htmlContent: "https://px.a8.net/?a8mat=BBB+TOKEN+DDD" },
  ]);
  assert.equal(result.byAdId.banner, "a8:s00000012345678");
  assert.equal(result.byAdId.text, "a8:s00000012345678");
  assert.deepEqual(result.unresolved, []);
});

test("曖昧な a8mat token は推測せず unresolved 扱いにする", () => {
  const result = deriveAffiliateProgramRefs([
    { id: "a", htmlContent: "?a8mat=A+TOKEN+C", imageUrl: "?mid=s00000012345678010000" },
    { id: "b", htmlContent: "?a8mat=B+TOKEN+D", imageUrl: "?mid=s00000087654321010000" },
    { id: "text", htmlContent: "?a8mat=E+TOKEN+F" },
  ]);
  assert.equal(result.byAdId.text, undefined);
  assert.equal(result.ambiguous.length, 1);
});

test("unknown profile を discovery へ流す mutation は validator と queue の両方で失敗する", () => {
  const unknown = profile({
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
  });
  assert.deepEqual(validateAffiliateOfferProfiles({ profiles: [unknown], ads: [ad()], knownVerticals: verticals }), []);
  const queues = buildAffiliateOfferQueues({
    profiles: [unknown],
    ads: [ad()],
    outcomeAvailableProgramRefs: [unknown.programRef],
    pageType: "ranking",
    vertical: "education",
  });
  assert.equal(queues.discovery.length, 0);
  assert.ok(queues.excluded[0].reasons.includes("offer-profile-unclassified"));

  const invalidMutation = { ...unknown, lane: "discovery", portfolioStatus: "pilot-ready", allowedPageTypes: ["ranking"] };
  const errors = validateAffiliateOfferProfiles({ profiles: [invalidMutation], ads: [ad()], knownVerticals: verticals });
  assert.ok(errors.some((error) => error.includes("unknown-profile-must-be-pending")));
});

test("高負担 F4 は discovery/theme に出さない", () => {
  const highFriction = profile({ lane: "discovery", frictionTier: "F4", allowedPageTypes: ["theme"] });
  assert.ok(
    validateAffiliateOfferProfiles({ profiles: [highFriction], ads: [ad()], knownVerticals: verticals }).some((error) =>
      error.includes("discovery-friction-mismatch"),
    ),
  );
  const queues = buildAffiliateOfferQueues({
    profiles: [highFriction],
    ads: [ad()],
    outcomeAvailableProgramRefs: [highFriction.programRef],
    pageType: "theme",
    vertical: "education",
  });
  assert.equal(queues.discovery.length, 0);
});

test("F1 でも vertical が一致しなければ候補にしない", () => {
  const queues = buildAffiliateOfferQueues({
    profiles: [profile()],
    ads: [ad()],
    outcomeAvailableProgramRefs: ["a8:s00000000000001"],
    pageType: "ranking",
    vertical: "economy",
  });
  assert.equal(queues.discovery.length, 0);
  assert.ok(queues.excluded[0].reasons.includes("vertical-mismatch"));
});

test("decision は ranking target が無ければ候補にしない", () => {
  const queues = buildAffiliateOfferQueues({
    profiles: [profile({ lane: "decision", frictionTier: "F3" })],
    ads: [ad()],
    outcomeAvailableProgramRefs: ["a8:s00000000000001"],
    pageType: "ranking",
    vertical: "education",
  });
  assert.equal(queues.decision.length, 0);
  assert.ok(queues.excluded[0].reasons.includes("decision-target-required"));
});

test("experiment variant は通常 reader と候補 queue から除外する", () => {
  const variant = ad({ experimentId: "exp", variantId: "A", targetRankingKeys: ["school"] });
  assert.equal(isNormalAffiliateAd(variant), false);
  const queues = buildAffiliateOfferQueues({
    profiles: [profile()],
    ads: [variant],
    outcomeAvailableProgramRefs: ["a8:s00000000000001"],
    pageType: "ranking",
    vertical: "education",
    rankingKey: "school",
  });
  assert.equal(queues.discovery.length, 0);
  assert.ok(queues.excluded[0].reasons.includes("experiment-variant-isolated"));
});

test("shared account outcome は広告別勝敗の候補へ入れない", () => {
  const queues = buildAffiliateOfferQueues({
    profiles: [profile()],
    ads: [ad()],
    sharedProgramRefs: ["a8:s00000000000001"],
    outcomeAvailableProgramRefs: ["a8:s00000000000001"],
    pageType: "ranking",
    vertical: "education",
  });
  assert.equal(queues.discovery.length, 0);
  assert.ok(queues.excluded[0].reasons.includes("outcome-scope-shared-account"));
});
