import {
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueCorrectionAudit,
  type JapanZueEvidenceCandidate,
  type JapanZueSourceCorrection,
} from "./types";

const ERRATA_URL = "https://yt-ms.jp/errata/j_zue202526/";

/** 出版社の正誤表を、訂正表現そのものを複製せず位置と影響だけで保持する。 */
export const JAPAN_ZUE_SOURCE_CORRECTIONS = [
  { id: "errata-p031-figure-2-4", page: 31, targetKind: "figure", itemNumber: "2-4", classification: "footnote", affectsQuantitativeSemantics: false },
  { id: "errata-p160-table-12-1", page: 160, targetKind: "table", itemNumber: "12-1", classification: "footnote", affectsQuantitativeSemantics: false },
  { id: "errata-p180-figure-15-5", page: 180, targetKind: "figure", itemNumber: "15-5", classification: "title", affectsQuantitativeSemantics: true },
  { id: "errata-p186-body", page: 186, targetKind: "text-stat", classification: "body", affectsQuantitativeSemantics: false },
  { id: "errata-p207-table-17-17", page: 207, targetKind: "table", itemNumber: "17-17", classification: "footnote", affectsQuantitativeSemantics: true },
  { id: "errata-p232-table-19-4", page: 232, targetKind: "table", itemNumber: "19-4", classification: "label", affectsQuantitativeSemantics: true },
  { id: "errata-p270-table-24-5", page: 270, targetKind: "table", itemNumber: "24-5", classification: "label", affectsQuantitativeSemantics: true },
  { id: "errata-p275-table-24-8", page: 275, targetKind: "table", itemNumber: "24-8", classification: "label", affectsQuantitativeSemantics: true },
  { id: "errata-p283-table-24-12", page: 283, targetKind: "table", itemNumber: "24-12", classification: "row-membership", affectsQuantitativeSemantics: true },
  { id: "errata-p295-table-24-44", page: 295, targetKind: "table", itemNumber: "24-44", classification: "value", affectsQuantitativeSemantics: true },
  { id: "errata-p441-table-34-13", page: 441, targetKind: "table", itemNumber: "34-13", classification: "footnote", affectsQuantitativeSemantics: false },
].map((correction) => ({
  ...correction,
  sourceUrl: ERRATA_URL,
  checkedAt: "2026-08-28",
})) as readonly JapanZueSourceCorrection[];

function candidateCoversCorrection(candidate: JapanZueEvidenceCandidate, correction: JapanZueSourceCorrection): boolean {
  if (candidate.source.kind !== correction.targetKind) return false;
  if (correction.itemNumber && candidate.source.itemNumber !== correction.itemNumber) return false;
  return candidate.source.page === correction.page || (candidate.source.continuationPages ?? []).includes(correction.page);
}

export function auditJapanZueCorrections(
  candidates: readonly JapanZueEvidenceCandidate[],
  corrections: readonly JapanZueSourceCorrection[] = JAPAN_ZUE_SOURCE_CORRECTIONS,
  edition = "2025-26",
): JapanZueCorrectionAudit {
  const impacted = corrections.map((correction) => ({
    correctionId: correction.id,
    candidateIds: candidates.filter((candidate) => candidateCoversCorrection(candidate, correction)).map(({ id }) => id).sort(),
  }));
  const impactedById = new Map(impacted.map((entry) => [entry.correctionId, entry.candidateIds]));
  const missingQuantitativeTargets = corrections
    .filter(({ affectsQuantitativeSemantics }) => affectsQuantitativeSemantics)
    .filter(({ id }) => (impactedById.get(id) ?? []).length === 0)
    .map(({ id }) => id)
    .sort();
  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition,
    correctionCount: corrections.length,
    quantitativeCorrectionCount: corrections.filter(({ affectsQuantitativeSemantics }) => affectsQuantitativeSemantics).length,
    impacted,
    missingQuantitativeTargets,
    isClean: missingQuantitativeTargets.length === 0,
  };
}
