import type {
  JapanZueCandidateDiff,
  JapanZueCandidateDocument,
  JapanZueEvidenceItem,
} from "./types";

function stableCandidatePayload(document: JapanZueCandidateDocument, id: string): string | undefined {
  const candidate = document.candidates.find((entry) => entry.id === id);
  return candidate ? JSON.stringify(candidate) : undefined;
}

export function diffJapanZueCandidates(
  previous: JapanZueCandidateDocument,
  next: JapanZueCandidateDocument,
  inventory: readonly JapanZueEvidenceItem[],
): JapanZueCandidateDiff {
  const previousIds = new Set(previous.candidates.map(({ id }) => id));
  const nextIds = new Set(next.candidates.map(({ id }) => id));
  const addedIds = [...nextIds].filter((id) => !previousIds.has(id)).sort();
  const removedIds = [...previousIds].filter((id) => !nextIds.has(id)).sort();
  const sharedIds = [...nextIds].filter((id) => previousIds.has(id));
  const changedIds = sharedIds
    .filter((id) => stableCandidatePayload(previous, id) !== stableCandidatePayload(next, id))
    .sort();
  const changedSet = new Set(changedIds);
  const unchangedIds = sharedIds.filter((id) => !changedSet.has(id)).sort();
  const impactedIds = new Set([...addedIds, ...removedIds, ...changedIds]);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const impacted = [...impactedIds].sort().map((id) => {
    const mapping = inventoryById.get(id)?.mapping;
    return {
      id,
      metricKeys: [...(mapping?.metricKeys ?? [])].sort(),
      surveyIds: [...(mapping?.surveyIds ?? [])].sort(),
      themeSlugs: [...(mapping?.themeSlugs ?? [])].sort(),
      contentRoles: [...(mapping?.contentRoles ?? [])].sort(),
    };
  });
  return {
    previousEdition: previous.edition,
    nextEdition: next.edition,
    addedIds,
    removedIds,
    changedIds,
    unchangedIds,
    impacted,
  };
}
