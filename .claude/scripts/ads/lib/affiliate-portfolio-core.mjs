import { buildAffiliateOfferQueues } from "./affiliate-offer-core.mjs";

export const AFFILIATE_PORTFOLIO_SCHEMA_VERSION = 1;
export const REQUIRED_GA4_SCHEMA_VERSION = 3;

export function evaluateAffiliatePortfolioFreshness(state, nowIso, maxAgeDays = 10) {
  if (!state) return { status: "blocked", ageDays: null, reasons: ["affiliate-portfolio-state-missing"] };
  const generated = Date.parse(state.generatedAt ?? "");
  const now = Date.parse(nowIso ?? "");
  if (!Number.isFinite(generated) || !Number.isFinite(now)) {
    return { status: "blocked", ageDays: null, reasons: ["affiliate-portfolio-generated-at-invalid"] };
  }
  const ageDays = Math.floor((now - generated) / 86400000);
  const reasons = ageDays > maxAgeDays ? [`affiliate-portfolio-state-stale(${ageDays}d>${maxAgeDays}d)`] : [];
  return { status: reasons.length === 0 ? "ready" : "blocked", ageDays, reasons };
}

function ratio(numerator, denominator) {
  return denominator > 0 && numerator != null ? numerator / denominator : null;
}

function metric(value, reason) {
  return value == null ? { value: null, unavailableReason: reason } : { value, unavailableReason: null };
}

function sumKnown(values) {
  const known = values.filter((value) => typeof value === "number" && Number.isFinite(value));
  return known.length === values.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

function ga4Quality(ga4, measurementGate) {
  const reasons = [...(measurementGate?.reasons ?? [])];
  if (!ga4) reasons.push("ga4-snapshot-missing");
  else if (ga4.schemaVersion !== REQUIRED_GA4_SCHEMA_VERSION) reasons.push(`ga4-schema-unsupported(v${ga4.schemaVersion ?? 1})`);
  if (!Array.isArray(ga4?.overview)) reasons.push("ga4-overview-report-missing");
  if (!Array.isArray(ga4?.experiments)) reasons.push("ga4-experiments-report-missing");
  if (!Array.isArray(ga4?.pages)) reasons.push("ga4-pages-report-missing");
  return { status: reasons.length === 0 ? "ready" : "blocked", reasons: [...new Set(reasons)] };
}

function adGa4Metrics(adId, ga4, quality) {
  if (quality.status !== "ready") {
    return {
      impressions: metric(null, quality.reasons.join(",")),
      clicks: metric(null, quality.reasons.join(",")),
      ctr: metric(null, quality.reasons.join(",")),
    };
  }
  const rows = ga4.overview.filter((row) => row.ad_id === adId);
  const impressions = rows.reduce((sum, row) => sum + (Number(row.impressions) || 0), 0);
  const clicks = rows.reduce((sum, row) => sum + (Number(row.clicks) || 0), 0);
  return {
    impressions: metric(impressions, null),
    clicks: metric(clicks, null),
    ctr: metric(ratio(clicks, impressions), impressions === 0 ? "ga4-impressions-zero-for-ad" : null),
  };
}

function resultProgramRef(record, ads) {
  if (typeof record.programRef === "string") return record.programRef;
  const ids = String(record.program ?? "").split("+").filter(Boolean);
  const refs = [...new Set(ids.map((id) => ads.find((ad) => ad.id === id)?.programRef).filter(Boolean))];
  return refs.length === 1 ? refs[0] : null;
}

function outcomeByProgramRef({ a8Results, ads, outcomeGate, sharedProgramRefs }) {
  const map = new Map();
  if (outcomeGate?.status !== "ready" || !Array.isArray(a8Results?.records)) return map;
  for (const record of a8Results.records) {
    const programRef = resultProgramRef(record, ads);
    if (!programRef || sharedProgramRefs.includes(programRef)) continue;
    const current = map.get(programRef) ?? { clicks: 0, conversions: 0, approved: 0, revenueYen: 0 };
    current.clicks += Number(record.clicks) || 0;
    current.conversions += Number(record.conversions) || 0;
    current.approved += Number(record.approved) || 0;
    current.revenueYen += Number(record.revenueYen) || 0;
    map.set(programRef, current);
  }
  return map;
}

export function buildAffiliatePortfolioState({
  nowIso,
  ads,
  profiles,
  ga4,
  ga4Path,
  measurementGate,
  a8Results,
  a8ResultsPath,
  outcomeGate,
  sharedProgramRefs = [],
  activeExperiments = [],
}) {
  const profileByRef = new Map(profiles.map((profile) => [profile.programRef, profile]));
  const missingProgramRef = ads.filter((ad) => !ad.programRef).map((ad) => ad.id);
  const missingProfiles = ads.filter((ad) => ad.programRef && !profileByRef.has(ad.programRef)).map((ad) => ad.id);
  const unclassified = profiles
    .filter((profile) => profile.portfolioStatus === "pending-classification")
    .map((profile) => profile.programRef);
  const coverageReasons = [];
  if (missingProgramRef.length > 0) coverageReasons.push(`program-ref-missing:${missingProgramRef.length}`);
  if (missingProfiles.length > 0) coverageReasons.push(`offer-profile-missing:${missingProfiles.length}`);
  if (unclassified.length > 0) coverageReasons.push(`offer-profile-unclassified:${unclassified.length}`);
  const coverageGate = { status: coverageReasons.length === 0 ? "ready" : "blocked", reasons: coverageReasons };

  const ga4Gate = ga4Quality(ga4, measurementGate);
  const resolvedOutcomeGate = outcomeGate ?? { status: "blocked", reasons: ["outcome-gate-missing"] };
  const outcomes = outcomeByProgramRef({ a8Results, ads, outcomeGate: resolvedOutcomeGate, sharedProgramRefs });
  const adRows = ads.map((ad) => ({
    adId: ad.id,
    programRef: ad.programRef ?? null,
    vertical: ad.vertical ?? null,
    locationCode: ad.locationCode,
    isActive: ad.isActive === true,
    isExperimentVariant: Boolean(ad.experimentId || ad.variantId),
    metrics: adGa4Metrics(ad.id, ga4, ga4Gate),
  }));

  const offers = profiles.map((profile) => {
    const programAds = adRows.filter((ad) => ad.programRef === profile.programRef);
    const impressionsValue = sumKnown(programAds.map((ad) => ad.metrics.impressions.value));
    const clicksValue = sumKnown(programAds.map((ad) => ad.metrics.clicks.value));
    const outcome = outcomes.get(profile.programRef) ?? null;
    const outcomeReason = sharedProgramRefs.includes(profile.programRef)
      ? "a8-shared-account-program"
      : resolvedOutcomeGate.status !== "ready"
        ? resolvedOutcomeGate.reasons.join(",")
        : "confirmed-outcome-unavailable-for-program";
    const revenue = outcome?.revenueYen ?? null;
    return {
      programRef: profile.programRef,
      vertical: profile.vertical,
      allowedVerticals: profile.allowedVerticals,
      lane: profile.lane,
      actionType: profile.actionType,
      frictionTier: profile.frictionTier,
      portfolioStatus: profile.portfolioStatus,
      adIds: programAds.map((ad) => ad.adId),
      metrics: {
        impressions: metric(impressionsValue, ga4Gate.reasons.join(",")),
        clicks: metric(clicksValue, ga4Gate.reasons.join(",")),
        ctr: metric(ratio(clicksValue, impressionsValue), impressionsValue === 0 ? "ga4-impressions-zero-for-program" : ga4Gate.reasons.join(",")),
        conversions: metric(outcome?.conversions ?? null, outcomeReason),
        approved: metric(outcome?.approved ?? null, outcomeReason),
        confirmedRevenueYen: metric(revenue, outcomeReason),
        confirmedRevenuePer1000ViewableImpressions: metric(
          revenue != null && impressionsValue != null && impressionsValue > 0 ? (revenue * 1000) / impressionsValue : null,
          revenue == null ? outcomeReason : impressionsValue === 0 ? "ga4-impressions-zero-for-program" : ga4Gate.reasons.join(","),
        ),
      },
      sourceQuality: {
        ga4: ga4Gate,
        outcome: sharedProgramRefs.includes(profile.programRef)
          ? { status: "blocked", reasons: ["a8-shared-account-program"] }
          : resolvedOutcomeGate,
      },
    };
  });

  const queueInputs = {
    profiles,
    ads,
    sharedProgramRefs,
    outcomeAvailableProgramRefs: [...outcomes.keys()],
  };
  const compactQueue = (queue) => {
    const excludedByReason = {};
    for (const candidate of queue.excluded) {
      for (const reason of candidate.reasons) excludedByReason[reason] = (excludedByReason[reason] ?? 0) + 1;
    }
    return {
      discovery: queue.discovery.map((candidate) => ({ programRef: candidate.programRef, adIds: candidate.adIds })),
      decision: queue.decision.map((candidate) => ({ programRef: candidate.programRef, adIds: candidate.adIds })),
      excluded: { count: queue.excluded.length, byReason: excludedByReason },
    };
  };
  const queueContexts = [...new Set(profiles.flatMap((profile) => profile.allowedVerticals))].map((vertical) => ({
    vertical,
    ranking: compactQueue(buildAffiliateOfferQueues({ ...queueInputs, pageType: "ranking", vertical })),
    blog: compactQueue(buildAffiliateOfferQueues({ ...queueInputs, pageType: "blog", vertical })),
  }));

  const blockingCoverageReasons = coverageGate.reasons.filter(
    (reason) => !reason.startsWith("offer-profile-unclassified:"),
  );
  const portfolioReasons = [
    ...blockingCoverageReasons,
    ...(ga4Gate.status === "blocked" ? ga4Gate.reasons : []),
    ...(resolvedOutcomeGate.status === "blocked" ? resolvedOutcomeGate.reasons : []),
  ];
  const eligibleProgramRefs = new Set(queueContexts.flatMap(
    (context) => [
      ...context.ranking.discovery,
      ...context.ranking.decision,
      ...context.blog.discovery,
      ...context.blog.decision,
    ].map((candidate) => candidate.programRef),
  ));
  const hasEligibleCandidate = queueContexts.some(
    (context) => context.ranking.discovery.length + context.ranking.decision.length + context.blog.discovery.length + context.blog.decision.length > 0,
  );
  const hasEligibleLanePair = queueContexts.some(
    (context) =>
      (context.ranking.discovery.length > 0 && context.ranking.decision.length > 0) ||
      (context.blog.discovery.length > 0 && context.blog.decision.length > 0),
  );
  if (!hasEligibleCandidate) portfolioReasons.push("eligible-candidate-missing");
  const portfolioGate = { status: portfolioReasons.length === 0 ? "ready" : "blocked", reasons: [...new Set(portfolioReasons)] };
  const pilotReasons = [...portfolioGate.reasons];
  if (!hasEligibleLanePair) pilotReasons.push("eligible-lane-pair-missing");
  if (activeExperiments.length > 0) pilotReasons.push("existing-affiliate-experiment-active");

  return {
    schemaVersion: AFFILIATE_PORTFOLIO_SCHEMA_VERSION,
    generatedAt: nowIso,
    sources: {
      ga4: { path: ga4Path ?? null, generatedAt: ga4?.generatedAt ?? null, schemaVersion: ga4?.schemaVersion ?? null },
      a8: { path: a8ResultsPath ?? null, generatedAt: a8Results?.updatedAt ?? null, scope: "program-detail-account-wide" },
    },
    gates: {
      measurement: ga4Gate,
      coverage: coverageGate,
      outcome: resolvedOutcomeGate,
      portfolio: portfolioGate,
      pilot: { status: pilotReasons.length === 0 ? "ready" : "blocked", reasons: [...new Set(pilotReasons)] },
    },
    summary: {
      ads: ads.length,
      offers: profiles.length,
      unclassified: unclassified.length,
      sharedOutcomePrograms: sharedProgramRefs.length,
      eligibleCandidates: eligibleProgramRefs.size,
    },
    offers,
    ads: adRows,
    // ページ粒度だけを保持する。広告別の数値は ads/offers に既にあるため、
    // page×ad×vertical×position の高cardinalityな複製を state に持ち込まない。
    placements: Array.isArray(ga4?.pages) && ga4Gate.status === "ready" ? ga4.pages : [],
    queueContexts,
    recommendedActions: buildPortfolioRecommendedActions({
      coverageGate,
      ga4Gate,
      outcomeGate: resolvedOutcomeGate,
      unclassified,
      hasEligibleCandidate,
    }),
  };
}

function buildPortfolioRecommendedActions({ coverageGate, ga4Gate, outcomeGate, unclassified, hasEligibleCandidate }) {
  if (ga4Gate.status === "blocked") return [{ id: "repair-ga4-portfolio-measurement", reasons: ga4Gate.reasons }];
  if (outcomeGate.status === "blocked") return [{ id: "collect-fresh-site-scoped-outcomes", reasons: outcomeGate.reasons }];
  if (coverageGate.status === "blocked" && unclassified.length > 0) {
    return [{ id: "classify-next-offer", programRef: unclassified[0], reasons: ["offer-profile-unclassified"] }];
  }
  if (!hasEligibleCandidate) return [{ id: "review-one-portfolio-candidate", reasons: ["eligible-candidate-missing"] }];
  return [{ id: "present-one-pilot-candidate", reasons: [] }];
}

export function validateAffiliatePortfolioState(state) {
  const errors = [];
  if (state?.schemaVersion !== AFFILIATE_PORTFOLIO_SCHEMA_VERSION) errors.push("schema-version-invalid");
  if (!state?.generatedAt || Number.isNaN(Date.parse(state.generatedAt))) errors.push("generated-at-invalid");
  for (const gateName of ["measurement", "coverage", "outcome", "portfolio", "pilot"]) {
    const gate = state?.gates?.[gateName];
    if (!gate || !["ready", "blocked"].includes(gate.status)) errors.push(`gate-invalid:${gateName}`);
    if (!Array.isArray(gate?.reasons)) errors.push(`gate-reasons-invalid:${gateName}`);
    if (gate?.status === "blocked" && gate.reasons.length === 0) errors.push(`gate-blocked-without-reason:${gateName}`);
  }
  for (const offer of state?.offers ?? []) {
    for (const [name, value] of Object.entries(offer.metrics ?? {})) {
      if (value?.value == null && !value?.unavailableReason) errors.push(`metric-null-without-reason:${offer.programRef}:${name}`);
      if (value?.value != null && value?.unavailableReason != null) errors.push(`metric-value-with-reason:${offer.programRef}:${name}`);
    }
  }
  if (!Array.isArray(state?.recommendedActions) || state.recommendedActions.length !== 1) {
    errors.push("recommended-actions-must-contain-exactly-one");
  }
  return errors;
}
