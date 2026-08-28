/**
 * アフィリエイト案件の authored profile / 配信 creative / 運用値を結ぶ純粋コア。
 * 外部アクセスやファイル I/O を持たず、未確認値は必ず fail-closed にする。
 */

export const OFFER_LANES = Object.freeze(["discovery", "decision", "unknown"]);
export const FRICTION_TIERS = Object.freeze(["F0", "F1", "F2", "F3", "F4", "unknown"]);
export const ACTION_TYPES = Object.freeze([
  "click",
  "download",
  "free-registration",
  "document-request",
  "reservation",
  "consultation",
  "purchase",
  "contract",
  "unknown",
]);
export const PERSONAL_DATA_LEVELS = Object.freeze(["none", "basic", "sensitive", "unknown"]);
export const HUMAN_CONTACT_VALUES = Object.freeze(["none", "optional", "required", "unknown"]);
export const PORTFOLIO_STATUSES = Object.freeze([
  "candidate",
  "pilot-ready",
  "active",
  "paused",
  "blocked",
  "pending-classification",
]);
export const OFFER_PAGE_TYPES = Object.freeze(["ranking", "blog", "theme", "area"]);

const PROGRAM_REF_PATTERN = /^(a8|afb|moshimo|rakuten|valuecommerce):[^:\s]+$/;
const A8_PROGRAM_PATTERN = /mid=(s[0-9]{14})/i;
const A8_MATERIAL_PROGRAM_TOKEN_PATTERN = /a8mat=[^+&]+[+]([^+&]+)/i;

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value !== ""))];
}

function joinedTrackingText(ad) {
  return [ad?.htmlContent, ad?.imageUrl, ad?.trackingPixelUrl].filter(Boolean).join(" ");
}

function a8MaterialProgramToken(ad) {
  return joinedTrackingText(ad).match(A8_MATERIAL_PROGRAM_TOKEN_PATTERN)?.[1] ?? null;
}

function explicitNonA8ProgramRef(ad) {
  const text = joinedTrackingText(ad);
  if (/valuecommerce/i.test(text)) {
    const pid = text.match(/[?&]pid=([0-9]+)/i)?.[1];
    return pid ? `valuecommerce:${pid}` : null;
  }
  if (/afi-b\.com/i.test(text)) {
    const affiliateId = text.match(/[?&]a=([A-Za-z][0-9]+[A-Za-z])/i)?.[1];
    return affiliateId ? `afb:${affiliateId}` : null;
  }
  if (/rakuten/i.test(text)) return `rakuten:${ad.id}`;
  return null;
}

/**
 * A8 banner の mid と a8mat の program token を突合し、text creative も同一 programRef へ寄せる。
 * ambiguous token は推測せず unresolved に残す。overrides は実機確認済みの例外だけに使う。
 */
export function deriveAffiliateProgramRefs(ads, overrides = {}) {
  const tokenToPrograms = new Map();
  for (const ad of ads) {
    const text = joinedTrackingText(ad);
    const programId = text.match(A8_PROGRAM_PATTERN)?.[1];
    const token = a8MaterialProgramToken(ad);
    if (!programId || !token) continue;
    const programs = tokenToPrograms.get(token) ?? new Set();
    programs.add(programId);
    tokenToPrograms.set(token, programs);
  }

  const byAdId = {};
  const unresolved = [];
  const ambiguous = [];
  for (const ad of ads) {
    const override = overrides[ad.id];
    if (override) {
      byAdId[ad.id] = override;
      continue;
    }

    const text = joinedTrackingText(ad);
    const directProgramId = text.match(A8_PROGRAM_PATTERN)?.[1];
    if (directProgramId) {
      byAdId[ad.id] = `a8:${directProgramId}`;
      continue;
    }

    const token = a8MaterialProgramToken(ad);
    const tokenPrograms = token ? tokenToPrograms.get(token) : null;
    if (tokenPrograms?.size === 1) {
      byAdId[ad.id] = `a8:${[...tokenPrograms][0]}`;
      continue;
    }

    const idProgram = String(ad.id ?? "").match(/s[0-9]{14}/)?.[0];
    if (idProgram && /a8/i.test(text)) {
      byAdId[ad.id] = `a8:${idProgram}`;
      continue;
    }

    const nonA8 = explicitNonA8ProgramRef(ad);
    if (nonA8) {
      byAdId[ad.id] = nonA8;
      continue;
    }

    if (tokenPrograms && tokenPrograms.size > 1) {
      ambiguous.push({ adId: ad.id, token, programRefs: [...tokenPrograms].sort().map((id) => `a8:${id}`) });
    } else {
      unresolved.push({ adId: ad.id, token });
    }
  }

  return { byAdId, unresolved, ambiguous };
}

function isValidDate(value) {
  return typeof value === "string" && value !== "" && !Number.isNaN(Date.parse(value));
}

function isUnknownProfile(profile) {
  return (
    profile.lane === "unknown" ||
    profile.actionType === "unknown" ||
    profile.frictionTier === "unknown" ||
    profile.personalDataLevel === "unknown" ||
    profile.humanContact === "unknown" ||
    !profile.conversionCondition ||
    !profile.conditionSource ||
    !isValidDate(profile.verifiedAt)
  );
}

export function validateAffiliateOfferProfiles({ profiles, ads, knownVerticals }) {
  const errors = [];
  const profileByRef = new Map();
  const knownRefs = new Set(ads.map((ad) => ad.programRef).filter(Boolean));
  const verticalSet = new Set(knownVerticals);

  for (const [index, profile] of profiles.entries()) {
    const path = `profiles[${index}]`;
    if (!PROGRAM_REF_PATTERN.test(profile.programRef ?? "")) errors.push(`${path}.programRef-invalid`);
    if (profileByRef.has(profile.programRef)) errors.push(`${path}.programRef-duplicate:${profile.programRef}`);
    profileByRef.set(profile.programRef, profile);
    if (!verticalSet.has(profile.vertical)) errors.push(`${path}.vertical-invalid`);
    if (
      !Array.isArray(profile.allowedVerticals) ||
      profile.allowedVerticals.length === 0 ||
      profile.allowedVerticals.some((value) => !verticalSet.has(value)) ||
      profile.allowedVerticals[0] !== profile.vertical
    ) {
      errors.push(`${path}.allowed-verticals-invalid`);
    }
    if (!OFFER_LANES.includes(profile.lane)) errors.push(`${path}.lane-invalid`);
    if (!ACTION_TYPES.includes(profile.actionType)) errors.push(`${path}.action-type-invalid`);
    if (!FRICTION_TIERS.includes(profile.frictionTier)) errors.push(`${path}.friction-tier-invalid`);
    if (!PERSONAL_DATA_LEVELS.includes(profile.personalDataLevel)) errors.push(`${path}.personal-data-invalid`);
    if (!HUMAN_CONTACT_VALUES.includes(profile.humanContact)) errors.push(`${path}.human-contact-invalid`);
    if (!PORTFOLIO_STATUSES.includes(profile.portfolioStatus)) errors.push(`${path}.portfolio-status-invalid`);
    if (!Array.isArray(profile.allowedPageTypes) || profile.allowedPageTypes.some((v) => !OFFER_PAGE_TYPES.includes(v))) {
      errors.push(`${path}.allowed-page-types-invalid`);
    }

    const unknown = isUnknownProfile(profile);
    if (unknown && profile.portfolioStatus !== "pending-classification" && profile.portfolioStatus !== "blocked") {
      errors.push(`${path}.unknown-profile-must-be-pending`);
    }
    if (!unknown && (!profile.conditionSource || !isValidDate(profile.verifiedAt))) {
      errors.push(`${path}.condition-evidence-required`);
    }
    if (profile.lane === "discovery" && !["F0", "F1", "F2"].includes(profile.frictionTier)) {
      errors.push(`${path}.discovery-friction-mismatch`);
    }
    if (profile.lane === "discovery" && profile.personalDataLevel === "sensitive") {
      errors.push(`${path}.discovery-sensitive-data`);
    }
    if (profile.lane === "decision" && !["F2", "F3", "F4"].includes(profile.frictionTier)) {
      errors.push(`${path}.decision-friction-mismatch`);
    }
    if (!knownRefs.has(profile.programRef)) errors.push(`${path}.program-ref-not-used:${profile.programRef}`);
  }

  for (const ad of ads) {
    if (!PROGRAM_REF_PATTERN.test(ad.programRef ?? "")) {
      errors.push(`ad:${ad.id}.program-ref-missing`);
      continue;
    }
    const profile = profileByRef.get(ad.programRef);
    if (!profile) {
      errors.push(`ad:${ad.id}.offer-profile-missing:${ad.programRef}`);
      continue;
    }
    if (ad.vertical && !profile.allowedVerticals.includes(ad.vertical)) {
      errors.push(`ad:${ad.id}.vertical-mismatch:${ad.vertical}:${profile.vertical}`);
    }
  }

  return uniqueStrings(errors);
}

function offerBlockReasons({ profile, ads, sharedProgramRefs = [], outcomeAvailableProgramRefs = [] }) {
  const reasons = [];
  if (!profile) return ["offer-profile-missing"];
  if (isUnknownProfile(profile)) reasons.push("offer-profile-unclassified");
  if (["blocked", "paused", "pending-classification"].includes(profile.portfolioStatus)) {
    reasons.push(`portfolio-status:${profile.portfolioStatus}`);
  }
  if (sharedProgramRefs.includes(profile.programRef)) reasons.push("outcome-scope-shared-account");
  if (!outcomeAvailableProgramRefs.includes(profile.programRef)) reasons.push("confirmed-outcome-unavailable");
  if (profile.lane === "discovery") {
    if (!["F0", "F1", "F2"].includes(profile.frictionTier)) reasons.push("discovery-friction-ineligible");
    if (profile.personalDataLevel === "sensitive") reasons.push("discovery-sensitive-data");
  }
  if (profile.lane === "decision") {
    const hasTarget = ads.some(
      (ad) => ad.programRef === profile.programRef && Array.isArray(ad.targetRankingKeys) && ad.targetRankingKeys.length > 0,
    );
    if (!hasTarget) reasons.push("decision-target-required");
  }
  return uniqueStrings(reasons);
}

/** discovery / decision を別キューにし、unknown や shared outcome を候補へ入れない。 */
export function buildAffiliateOfferQueues({
  profiles,
  ads,
  sharedProgramRefs = [],
  outcomeAvailableProgramRefs = [],
  pageType,
  vertical,
  rankingKey = null,
}) {
  const result = { discovery: [], decision: [], excluded: [] };
  for (const profile of profiles) {
    const programAds = ads.filter((ad) => ad.programRef === profile.programRef && ad.isActive === true);
    const reasons = offerBlockReasons({ profile, ads: programAds, sharedProgramRefs, outcomeAvailableProgramRefs });
    if (!profile.allowedVerticals.includes(vertical)) reasons.push("vertical-mismatch");
    if (!profile.allowedPageTypes.includes(pageType)) reasons.push("page-type-not-allowed");
    if (programAds.some((ad) => ad.experimentId || ad.variantId)) reasons.push("experiment-variant-isolated");
    if (programAds.length === 0) reasons.push("active-creative-missing");
    if (
      pageType === "ranking" &&
      rankingKey &&
      programAds.some((ad) => Array.isArray(ad.targetRankingKeys) && ad.targetRankingKeys.length > 0) &&
      !programAds.some((ad) => ad.targetRankingKeys?.includes(rankingKey))
    ) {
      reasons.push("ranking-key-mismatch");
    }
    const candidate = { programRef: profile.programRef, profile, adIds: programAds.map((ad) => ad.id), reasons: uniqueStrings(reasons) };
    if (candidate.reasons.length > 0 || !["discovery", "decision"].includes(profile.lane)) {
      result.excluded.push(candidate);
    } else {
      result[profile.lane].push(candidate);
    }
  }
  return result;
}

/** 通常 reader から experiment variant を必ず除外する。 */
export function isNormalAffiliateAd(ad) {
  return !(ad.experimentId || ad.variantId);
}
