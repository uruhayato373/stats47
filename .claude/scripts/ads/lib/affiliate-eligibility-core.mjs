/**
 * アフィリエイト案件の掲載適格性を判定する純粋コア。
 * policy の語彙以外、未設定、未承認はすべて fail-closed にする。
 */
import { readFileSync } from "node:fs";

const POLICY = JSON.parse(
  readFileSync(new URL("../data/affiliate-eligibility-policy.json", import.meta.url), "utf8"),
);

export const AFFILIATE_ELIGIBILITY_POLICY_VERSION = POLICY.schemaVersion;

const STATUS_SET = new Set(POLICY.statuses);
const RISK_FLAG_SET = new Set(POLICY.riskFlags);
const PAGE_TYPE_SET = new Set(POLICY.pageTypes);
const REVIEWER_SET = new Set(POLICY.reviewers);
const SCHEMA_REASON_SET = new Set([
  "eligibility-missing",
  "status-invalid",
  "risk-flags-invalid",
  "page-types-invalid",
  "ranking-keys-invalid",
  "tag-keys-invalid",
  "evidence-invalid",
  "reviewer-invalid",
  "reviewed-at-invalid",
  "minimum-impressions-invalid",
]);

function normalizeStringArray(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    return null;
  }
  return [...new Set(value.map((item) => item.trim()))].sort();
}

function containsOnly(values, vocabulary) {
  return values != null && values.every((value) => vocabulary.has(value));
}

function validReviewedAt(value) {
  return value === null || (typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value)));
}

/**
 * @param {unknown} input AffiliateEligibility
 * @returns {{eligible:boolean,reasons:string[],normalized:object}}
 */
export function evaluateAffiliateEligibility(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      eligible: false,
      reasons: ["eligibility-missing"],
      normalized: emptyEligibility(),
    };
  }

  const riskFlags = normalizeStringArray(input.riskFlags);
  const allowedPageTypes = normalizeStringArray(input.allowedPageTypes);
  const allowedRankingKeys = normalizeStringArray(input.allowedRankingKeys);
  const allowedTagKeys = normalizeStringArray(input.allowedTagKeys);
  const evidence = normalizeStringArray(input.evidence);
  const reasons = [];

  if (!STATUS_SET.has(input.status)) reasons.push("status-invalid");
  if (input.status !== "approved") reasons.push("status-not-approved");
  if (!containsOnly(riskFlags, RISK_FLAG_SET)) reasons.push("risk-flags-invalid");
  if (!containsOnly(allowedPageTypes, PAGE_TYPE_SET)) reasons.push("page-types-invalid");
  if (allowedRankingKeys == null) reasons.push("ranking-keys-invalid");
  if (allowedTagKeys == null) reasons.push("tag-keys-invalid");
  if (evidence == null) reasons.push("evidence-invalid");
  if (input.reviewedBy !== null && !REVIEWER_SET.has(input.reviewedBy)) {
    reasons.push("reviewer-invalid");
  }
  if (!validReviewedAt(input.reviewedAt)) reasons.push("reviewed-at-invalid");
  if (
    input.minimumEligibleImpressions !== null &&
    (!Number.isInteger(input.minimumEligibleImpressions) || input.minimumEligibleImpressions < 0)
  ) {
    reasons.push("minimum-impressions-invalid");
  }

  const hasTarget =
    (allowedPageTypes?.length ?? 0) > 0 ||
    (allowedRankingKeys?.length ?? 0) > 0 ||
    (allowedTagKeys?.length ?? 0) > 0;
  if (!hasTarget) reasons.push("target-allowlist-empty");

  if (
    (riskFlags?.length ?? 0) > 0 &&
    (input.reviewedBy !== "owner" || !validReviewedAt(input.reviewedAt) || input.reviewedAt === null || (evidence?.length ?? 0) === 0)
  ) {
    reasons.push("risk-owner-approval-required");
  }

  return {
    eligible: reasons.length === 0,
    reasons: [...new Set(reasons)],
    normalized: {
      status: STATUS_SET.has(input.status) ? input.status : null,
      riskFlags: riskFlags ?? [],
      allowedPageTypes: allowedPageTypes ?? [],
      allowedRankingKeys: allowedRankingKeys ?? [],
      allowedTagKeys: allowedTagKeys ?? [],
      minimumEligibleImpressions:
        input.minimumEligibleImpressions === null || Number.isInteger(input.minimumEligibleImpressions)
          ? input.minimumEligibleImpressions
          : null,
      reviewedAt: validReviewedAt(input.reviewedAt) ? input.reviewedAt : null,
      reviewedBy: REVIEWER_SET.has(input.reviewedBy) ? input.reviewedBy : null,
      evidence: evidence ?? [],
    },
  };
}

function emptyEligibility() {
  return {
    status: null,
    riskFlags: [],
    allowedPageTypes: [],
    allowedRankingKeys: [],
    allowedTagKeys: [],
    minimumEligibleImpressions: null,
    reviewedAt: null,
    reviewedBy: null,
    evidence: [],
  };
}

/** plan の再照合に使う、配列順に依存しない決定的な材料。 */
export function buildEligibilityFingerprintMaterial(input) {
  const result = evaluateAffiliateEligibility(input);
  return {
    policyVersion: AFFILIATE_ELIGIBILITY_POLICY_VERSION,
    eligible: result.eligible,
    reasons: [...result.reasons].sort(),
    ...result.normalized,
  };
}

/** catalog に値が存在するときの構造違反だけを返す。pending は正しい状態なので違反ではない。 */
export function validateAffiliateEligibilitySchema(input) {
  return evaluateAffiliateEligibility(input).reasons.filter((reason) => SCHEMA_REASON_SET.has(reason));
}
