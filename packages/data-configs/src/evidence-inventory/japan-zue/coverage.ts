import {
  JAPAN_ZUE_EDITION,
  JAPAN_ZUE_RESOLUTIONS,
  type JapanZueCoverageSummary,
  type JapanZueEvidenceCandidate,
  type JapanZueEvidenceItem,
  type JapanZueResolution,
} from "./types";

const PRODUCTION_RESOLUTIONS = new Set<JapanZueResolution>([
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
  "context-only",
]);

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const found = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) found.add(id);
    seen.add(id);
  }
  return [...found].sort();
}

function percent(numerator: number, denominator: number): number {
  if (denominator === 0) return 100;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

function productionBlockerReasons(item: JapanZueEvidenceItem): string[] {
  if (!PRODUCTION_RESOLUTIONS.has(item.resolution)) return [];
  const sources = item.primarySources ?? (item.primarySource ? [item.primarySource] : []);
  if (sources.length === 0) return ["primary-source-missing"];
  const reasons = new Set<string>();
  for (const source of sources) {
    if (source.rights !== "allowed") reasons.add("rights-not-allowed");
    if (!source.termsUrl) reasons.add("terms-url-missing");
    if (source.dataYears.length === 0) reasons.add("data-years-missing");
  }
  if (!item.mapping || item.mapping.geoScopes.length === 0) reasons.add("geo-scope-missing");
  return [...reasons];
}

export function summarizeJapanZueCoverage(
  candidates: readonly JapanZueEvidenceCandidate[],
  inventory: readonly JapanZueEvidenceItem[],
  edition: string = JAPAN_ZUE_EDITION,
): JapanZueCoverageSummary {
  const candidateIds = candidates.map(({ id }) => id);
  const inventoryIds = inventory.map(({ id }) => id);
  const candidateSet = new Set(candidateIds);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const missingInventoryIds = [...candidateSet].filter((id) => !inventoryById.has(id)).sort();
  const orphanInventoryIds = inventoryIds.filter((id) => !candidateSet.has(id)).sort();
  const resolutionCounts = Object.fromEntries(JAPAN_ZUE_RESOLUTIONS.map((resolution) => [resolution, 0])) as Record<
    JapanZueResolution,
    number
  >;
  for (const item of inventory) resolutionCounts[item.resolution] += 1;

  const unreviewedIds = [
    ...new Set([
      ...missingInventoryIds,
      ...inventory.filter(({ resolution }) => resolution === "unreviewed").map(({ id }) => id),
    ]),
  ].sort();
  const resolvedCandidateIds = [...candidateSet].filter((id) => {
    const item = inventoryById.get(id);
    return item !== undefined && item.resolution !== "unreviewed";
  });
  const notQuantitativeIds = new Set(
    inventory.filter(({ resolution }) => resolution === "not-quantitative").map(({ id }) => id),
  );
  const quantitativeCandidateIds = [...candidateSet].filter((id) => !notQuantitativeIds.has(id));
  const resolvedQuantitativeIds = quantitativeCandidateIds.filter((id) => {
    const item = inventoryById.get(id);
    return item !== undefined && item.resolution !== "unreviewed";
  });
  const productionBlockers = inventory
    .map((item) => ({ id: item.id, reasons: productionBlockerReasons(item) }))
    .filter(({ reasons }) => reasons.length > 0)
    .sort((left, right) => left.id.localeCompare(right.id));
  const duplicateCandidateIds = duplicates(candidateIds);
  const duplicateInventoryIds = duplicates(inventoryIds);
  const decisionCoveragePercent = percent(resolvedCandidateIds.length, candidateSet.size);
  const resolutionCoveragePercent = percent(resolvedQuantitativeIds.length, quantitativeCandidateIds.length);
  const isComplete =
    decisionCoveragePercent === 100 &&
    resolutionCoveragePercent === 100 &&
    missingInventoryIds.length === 0 &&
    orphanInventoryIds.length === 0 &&
    duplicateCandidateIds.length === 0 &&
    duplicateInventoryIds.length === 0 &&
    unreviewedIds.length === 0 &&
    productionBlockers.length === 0;

  return {
    schemaVersion: 1,
    sourceKey: "japan-zue",
    edition,
    candidateCount: candidateSet.size,
    inventoryCount: inventory.length,
    quantitativeItemCount: quantitativeCandidateIds.length,
    resolvedQuantitativeCount: resolvedQuantitativeIds.length,
    decisionCoveragePercent,
    resolutionCoveragePercent,
    resolutionCounts,
    missingInventoryIds,
    orphanInventoryIds,
    duplicateCandidateIds,
    duplicateInventoryIds,
    unreviewedIds,
    productionBlockers,
    isComplete,
  };
}
