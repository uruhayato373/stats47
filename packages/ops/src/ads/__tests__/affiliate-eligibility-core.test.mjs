import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildEligibilityFingerprintMaterial,
  evaluateAffiliateEligibility,
} from "../lib/affiliate-eligibility-core.mjs";

const approved = {
  status: "approved",
  riskFlags: [],
  allowedPageTypes: ["ranking"],
  allowedRankingKeys: [],
  allowedTagKeys: [],
  minimumEligibleImpressions: null,
  reviewedAt: "2026-08-25T00:00:00.000Z",
  reviewedBy: "code",
  evidence: ["policy-v1 automated review"],
};

test("eligibility 未設定・pending・blocked は申請 plan を許可しない", () => {
  assert.equal(evaluateAffiliateEligibility(undefined).eligible, false);
  assert.equal(evaluateAffiliateEligibility({ ...approved, status: "pending" }).eligible, false);
  assert.equal(evaluateAffiliateEligibility({ ...approved, status: "blocked" }).eligible, false);
});

test("approved でも掲載対象が空なら許可しない", () => {
  const result = evaluateAffiliateEligibility({
    ...approved,
    allowedPageTypes: [],
    allowedRankingKeys: [],
    allowedTagKeys: [],
  });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("target-allowlist-empty"));
});

test("risk flag が空で対象があれば code review でも許可する", () => {
  const result = evaluateAffiliateEligibility(approved);
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test("risk flag は案件単位の owner 承認・日時・証拠がすべて必要", () => {
  const codeReviewed = {
    ...approved,
    riskFlags: ["financial-high-risk"],
  };
  assert.equal(evaluateAffiliateEligibility(codeReviewed).eligible, false);

  const ownerApproved = {
    ...codeReviewed,
    reviewedBy: "owner",
    reviewedAt: "2026-08-25T01:00:00.000Z",
    evidence: ["owner approved program 123 after terms review"],
  };
  assert.equal(evaluateAffiliateEligibility(ownerApproved).eligible, true);
});

test("語彙外・型不正は fail-closed", () => {
  const result = evaluateAffiliateEligibility({
    ...approved,
    riskFlags: ["unknown-risk"],
    allowedPageTypes: ["home"],
    minimumEligibleImpressions: -1,
  });
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("risk-flags-invalid"));
  assert.ok(result.reasons.includes("page-types-invalid"));
  assert.ok(result.reasons.includes("minimum-impressions-invalid"));
});

test("fingerprint material は配列順を正規化し、適格性の変更を保持する", () => {
  const a = buildEligibilityFingerprintMaterial({
    ...approved,
    allowedPageTypes: ["theme", "ranking"],
    allowedRankingKeys: ["z", "a"],
  });
  const b = buildEligibilityFingerprintMaterial({
    ...approved,
    allowedPageTypes: ["ranking", "theme"],
    allowedRankingKeys: ["a", "z"],
  });
  assert.deepEqual(a, b);

  const changed = buildEligibilityFingerprintMaterial({
    ...approved,
    allowedPageTypes: ["ranking"],
    allowedRankingKeys: ["a", "z"],
  });
  assert.notDeepEqual(a, changed);
});
