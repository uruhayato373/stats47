import {
  JAPAN_ZUE_MAPPING_TIERS,
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueMappingQueue,
  type JapanZueMappingTier,
  type JapanZueEvidenceItem,
  type JapanZueMetricSuggestionReport,
  type JapanZueReviewQueue,
  type JapanZueSourceSuggestionReport,
} from "./types";

const REUSE_REVIEW_SCORE = 0.9;

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

export function buildJapanZueMappingQueue(
  reviewQueue: JapanZueReviewQueue,
  sourceSuggestions: JapanZueSourceSuggestionReport,
  metricSuggestions: JapanZueMetricSuggestionReport,
  evidenceItems: readonly JapanZueEvidenceItem[] = [],
): JapanZueMappingQueue {
  const groupByCandidate = new Map(
    reviewQueue.groups.flatMap((group) => group.candidateIds.map((candidateId) => [candidateId, group] as const)),
  );
  const sourceByGroup = new Map(
    sourceSuggestions.suggestions.map((suggestion) => [suggestion.reviewGroupId, suggestion] as const),
  );
  const metricByCandidate = new Map(
    metricSuggestions.suggestions.map((suggestion) => [suggestion.candidateId, suggestion] as const),
  );
  const reviewedByCandidate = new Map(evidenceItems.map((item) => [item.id, item.resolution] as const));

  const entries: JapanZueMappingQueue["entries"] = [...groupByCandidate.entries()]
    .map(([candidateId, group]) => {
      const source = sourceByGroup.get(group.id);
      const metric = metricByCandidate.get(candidateId);
      const compatibleMetricKeys = (metric?.matches ?? [])
        .filter(({ score, sourceCompatible }) => sourceCompatible && score >= REUSE_REVIEW_SCORE)
        .map(({ metricKey }) => metricKey);
      const tier: JapanZueMappingTier = compatibleMetricKeys.length > 0
        ? "metric-and-survey-review"
        : source
          ? "survey-only-review"
          : group.evidence.kind === "direct-citation"
            ? "direct-source-review"
            : "local-context-review";
      return {
        candidateId,
        reviewGroupId: group.id,
        tier,
        ...(reviewedByCandidate.has(candidateId)
          ? { reviewedResolution: reviewedByCandidate.get(candidateId) }
          : {}),
        ...(source ? { surveyIds: source.surveyIds } : {}),
        ...(compatibleMetricKeys.length > 0 ? { metricKeys: compatibleMetricKeys } : {}),
      };
    })
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));

  const candidateIds = [...groupByCandidate.keys()].sort();
  const queuedIds = entries.map(({ candidateId }) => candidateId);
  const queuedSet = new Set(queuedIds);
  const duplicateCandidateIds = duplicates(queuedIds);
  const missingCandidateIds = candidateIds.filter((candidateId) => !queuedSet.has(candidateId));
  const tierCounts = Object.fromEntries(
    JAPAN_ZUE_MAPPING_TIERS.map((tier) => [tier, entries.filter((entry) => entry.tier === tier).length]),
  ) as Record<JapanZueMappingTier, number>;
  const pendingEntries = entries.filter((entry) => !entry.reviewedResolution);
  const pendingTierCounts = Object.fromEntries(
    JAPAN_ZUE_MAPPING_TIERS.map((tier) => [tier, pendingEntries.filter((entry) => entry.tier === tier).length]),
  ) as Record<JapanZueMappingTier, number>;

  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition: reviewQueue.edition,
    candidateCount: reviewQueue.candidateCount,
    queuedCandidateCount: queuedSet.size,
    reviewedCandidateCount: entries.length - pendingEntries.length,
    pendingCandidateCount: pendingEntries.length,
    tierCounts,
    pendingTierCounts,
    duplicateCandidateIds,
    missingCandidateIds,
    entries,
    isComplete:
      reviewQueue.candidateCount === queuedSet.size &&
      duplicateCandidateIds.length === 0 &&
      missingCandidateIds.length === 0,
  };
}
