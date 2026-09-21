/** KDP publication workflow stages recorded in the operational listing ledger. */
export const KDP_PUBLICATION_STAGES = [
  "prepared",
  "details_filled",
  "files_processed",
  "verified",
  "submitted",
  "live",
  "previous_unpublished",
];

const STAGE_INDEX = new Map(KDP_PUBLICATION_STAGES.map((stage, index) => [stage, index]));

export function hasUnpublishedPredecessor(listing) {
  const previous = Array.isArray(listing?.previousEditions) ? listing.previousEditions : [];
  return previous.some(
    (edition) =>
      edition?.unpublishAfterReplacementLive === true &&
      !edition?.unpublishedAt &&
      !edition?.withdrawal?.unpublishedAt,
  );
}

export function stageForKdpStatus(listing, kdpStatus) {
  if (kdpStatus === "in_review") return "submitted";
  if (kdpStatus === "live") {
    const previous = Array.isArray(listing?.previousEditions) ? listing.previousEditions : [];
    if (!previous.length || hasUnpublishedPredecessor(listing)) return "live";
    return "previous_unpublished";
  }
  return null;
}

export function advancePublicationStage(
  listing,
  nextStage,
  checkedAt = new Date().toISOString(),
  evidence = {},
) {
  if (!STAGE_INDEX.has(nextStage)) throw new Error(`unknown KDP publication stage: ${nextStage}`);
  const current = listing?.publicationStage;
  if (current && STAGE_INDEX.has(current) && STAGE_INDEX.get(nextStage) < STAGE_INDEX.get(current)) {
    return {
      ...listing,
      publicationStageLastAttempt: {
        at: checkedAt,
        attemptedStage: nextStage,
        retainedStage: current,
        ...evidence,
      },
    };
  }
  const existingEvidence = listing?.publicationStageEvidence ?? {};
  return {
    ...listing,
    publicationStage: nextStage,
    publicationStageUpdatedAt: checkedAt,
    publicationStageEvidence: {
      ...existingEvidence,
      [nextStage]: { at: checkedAt, ...evidence },
    },
  };
}
