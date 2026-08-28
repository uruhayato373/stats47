/**
 * アフィリエイトpilotの開始可否・必要母数・観測判定を扱う純粋コア。
 * 外部変更や勝者選択は行わず、ready-to-presentでも人間へ比較材料を返すだけにする。
 */

export const AFFILIATE_PILOT_STATE_SCHEMA_VERSION = 2;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function finiteNonNegative(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function estimateAffiliatePilotFeasibility({
  baselineImpressions,
  baselineClicks,
  baselineWindowDays,
  variantCount = 2,
  minImpressionsPerVariant,
  minClicksPerVariant,
  maxDurationDays,
}) {
  const errors = [];
  for (const [name, value] of Object.entries({
    baselineImpressions,
    baselineClicks,
    baselineWindowDays,
    variantCount,
    minImpressionsPerVariant,
    minClicksPerVariant,
    maxDurationDays,
  })) {
    if (!finiteNonNegative(value) || value === 0) errors.push(`${name}-invalid`);
  }
  if (errors.length > 0) {
    return { status: "blocked", reasons: errors, baselineCtr: null, requiredImpressions: null, projectedDays: null };
  }

  const baselineCtr = baselineClicks / baselineImpressions;
  if (baselineCtr <= 0) {
    return {
      status: "not-feasible",
      reasons: ["baseline-click-rate-zero"],
      baselineCtr,
      requiredImpressions: null,
      projectedDays: null,
    };
  }
  const requiredByImpressions = minImpressionsPerVariant * variantCount;
  const requiredByClicks = Math.ceil((minClicksPerVariant * variantCount) / baselineCtr);
  const requiredImpressions = Math.max(requiredByImpressions, requiredByClicks);
  const dailyImpressions = baselineImpressions / baselineWindowDays;
  const projectedDays = Math.ceil(requiredImpressions / dailyImpressions);
  const status = projectedDays <= maxDurationDays ? "feasible" : "not-feasible";
  return {
    status,
    reasons: status === "feasible" ? [] : [`projected-duration-exceeds-maximum(${projectedDays}d>${maxDurationDays}d)`],
    baselineCtr,
    requiredImpressions,
    requiredClicks: minClicksPerVariant * variantCount,
    projectedDays,
  };
}

export function evaluateAffiliatePilotReadiness({
  portfolio,
  plan,
  activeExperiments = [],
  ownerApprovals = {},
  feasibility = null,
}) {
  const reasons = [];
  if (portfolio?.gates?.pilot?.status !== "ready") {
    reasons.push(...(portfolio?.gates?.pilot?.reasons ?? ["portfolio-pilot-gate-blocked"]));
  }
  if (!plan) {
    reasons.push("pilot-plan-missing");
  } else {
    if (!plan.programRef) reasons.push("pilot-program-ref-missing");
    if (!plan.pagePath || !["ranking", "blog"].includes(plan.pageType)) reasons.push("pilot-page-invalid");
    if (!Array.isArray(plan.variantIds) || plan.variantIds.length !== 2) reasons.push("pilot-exactly-two-variants-required");
    if (plan.primaryMetric !== "confirmed-revenue-per-1000-viewable-impressions") reasons.push("pilot-primary-metric-invalid");
    if (!finiteNonNegative(plan.minImpressionsPerVariant) || plan.minImpressionsPerVariant === 0) reasons.push("pilot-min-impressions-invalid");
    if (!finiteNonNegative(plan.minClicksPerVariant) || plan.minClicksPerVariant === 0) reasons.push("pilot-min-clicks-invalid");
    if (!finiteNonNegative(plan.minDurationDays) || !finiteNonNegative(plan.maxDurationDays) || plan.minDurationDays > plan.maxDurationDays) {
      reasons.push("pilot-duration-invalid");
    }
    if (!finiteNonNegative(plan.outcomeMaturityDays)) reasons.push("pilot-outcome-maturity-invalid");
    if (plan.riskVertical === "health" || plan.riskLevel === "high" || plan.personalDataLevel === "sensitive") {
      reasons.push("pilot-risk-excluded");
    }
    if (plan.reusesExistingPlacement !== true || plan.addsMobilePlacement === true || plan.ctaCount !== 1) {
      reasons.push("pilot-ux-guard-failed");
    }
  }
  if (activeExperiments.length > 0) reasons.push("existing-affiliate-experiment-active");
  for (const approval of ["offer", "page", "push"]) {
    if (ownerApprovals[approval] !== true) reasons.push(`owner-approval-missing:${approval}`);
  }
  if (!feasibility) reasons.push("pilot-feasibility-missing");
  else if (feasibility.status !== "feasible") reasons.push(...(feasibility.reasons ?? ["pilot-not-feasible"]));
  return { status: reasons.length === 0 ? "ready" : "blocked", reasons: unique(reasons) };
}

export function evaluateAffiliatePilotVerdict({ plan, readiness, observation, nowIso }) {
  if (readiness?.reasons?.includes("eligible-lane-pair-missing")) {
    return {
      status: "not-feasible",
      reasons: ["eligible-lane-pair-missing"],
      comparison: null,
      winnerVariantId: null,
    };
  }
  const reasons = [];
  if (!plan) reasons.push("pilot-plan-missing");
  if (readiness?.status !== "ready") reasons.push(...(readiness?.reasons ?? ["pilot-readiness-blocked"]));
  if (!observation) reasons.push("pilot-observation-missing");
  if (reasons.length > 0) {
    return { status: "pending", reasons: unique(reasons), comparison: null, winnerVariantId: null };
  }

  const variants = Array.isArray(observation.variants) ? observation.variants : [];
  if (variants.length !== 2) reasons.push("pilot-observation-two-variants-required");
  if ((observation.confounds ?? []).length > 0) {
    return { status: "confounded", reasons: observation.confounds.map((value) => `confound:${value}`), comparison: null, winnerVariantId: null };
  }
  const now = Date.parse(nowIso ?? "");
  const started = Date.parse(observation.startedAt ?? "");
  const daysElapsed = Number.isFinite(now) && Number.isFinite(started) ? Math.floor((now - started) / 86400000) : null;
  if (daysElapsed == null || daysElapsed < 0) reasons.push("pilot-dates-invalid");

  const sampleReached = variants.length === 2 && variants.every(
    (variant) => finiteNonNegative(variant.impressions) && variant.impressions >= plan.minImpressionsPerVariant &&
      finiteNonNegative(variant.clicks) && variant.clicks >= plan.minClicksPerVariant,
  );
  const outcomesMature = variants.length === 2 && variants.every((variant) => variant.outcomesMature === true);
  if (!sampleReached) reasons.push("pilot-sample-not-reached");
  if (daysElapsed != null && daysElapsed < plan.minDurationDays) reasons.push("pilot-min-duration-not-reached");
  if (!outcomesMature) reasons.push("pilot-outcomes-not-mature");

  if (reasons.length > 0) {
    const maxExpired = daysElapsed != null && daysElapsed >= plan.maxDurationDays;
    return {
      status: maxExpired ? "inconclusive" : "pending",
      reasons: unique(reasons),
      comparison: null,
      winnerVariantId: null,
    };
  }

  const comparison = variants.map((variant) => ({
    variantId: variant.variantId,
    impressions: variant.impressions,
    clicks: variant.clicks,
    ctr: variant.impressions > 0 ? variant.clicks / variant.impressions : null,
    confirmedRevenueYen: variant.confirmedRevenueYen,
    confirmedRevenuePer1000ViewableImpressions:
      variant.impressions > 0 && finiteNonNegative(variant.confirmedRevenueYen)
        ? (variant.confirmedRevenueYen * 1000) / variant.impressions
        : null,
  }));
  return { status: "ready-to-present", reasons: [], comparison, winnerVariantId: null };
}

export function buildAffiliatePilotState(input) {
  const readiness = evaluateAffiliatePilotReadiness(input);
  const verdict = evaluateAffiliatePilotVerdict({
    plan: input.plan,
    readiness,
    observation: input.observation,
    nowIso: input.nowIso,
  });
  const recommendedAction = verdict.status === "not-feasible"
    ? { id: "classify-next-offer-for-lane-pair", reasons: verdict.reasons }
    : readiness.status !== "ready"
      ? { id: "resolve-pilot-start-gates", reasons: readiness.reasons }
    : verdict.status === "ready-to-present"
      ? { id: "present-pilot-verdict-to-owner", reasons: [] }
      : { id: "continue-one-pilot-observation", reasons: verdict.reasons };
  return {
    schemaVersion: AFFILIATE_PILOT_STATE_SCHEMA_VERSION,
    generatedAt: input.nowIso,
    plan: input.plan ?? null,
    feasibility: input.feasibility ?? null,
    readiness,
    verdict,
    recommendedAction,
  };
}

export function validateAffiliatePilotState(state) {
  const errors = [];
  if (state?.schemaVersion !== AFFILIATE_PILOT_STATE_SCHEMA_VERSION) errors.push("schema-version-invalid");
  if (!state?.generatedAt || Number.isNaN(Date.parse(state.generatedAt))) errors.push("generated-at-invalid");
  if (!state?.readiness || !["ready", "blocked"].includes(state.readiness.status)) errors.push("readiness-invalid");
  if (!Array.isArray(state?.readiness?.reasons)) errors.push("readiness-reasons-invalid");
  if (!state?.verdict || !["pending", "not-feasible", "inconclusive", "confounded", "ready-to-present"].includes(state.verdict.status)) {
    errors.push("verdict-invalid");
  }
  if (state?.verdict?.winnerVariantId != null) errors.push("winner-must-not-be-selected-automatically");
  if (!state?.recommendedAction?.id || !Array.isArray(state.recommendedAction.reasons)) errors.push("recommended-action-invalid");
  return errors;
}
