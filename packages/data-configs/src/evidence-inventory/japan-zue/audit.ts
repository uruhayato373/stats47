import type { JapanZueCandidate, JapanZueEvidenceItem } from "../types";
import { hash64 } from "../../recipe";

export interface ExpressionMatch {
  publicId: string;
  fingerprint: string;
  windowLength: number;
}

export function normalizeExpression(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .toLowerCase();
}

/** 本文を返さず、長い逐語一致のhashだけを返す。 */
export function findExpressionMatches(
  publicTexts: ReadonlyArray<{ id: string; text: string }>,
  privateSourceText: string,
  windowLength = 24,
): ExpressionMatch[] {
  const privateNormalized = normalizeExpression(privateSourceText);
  const matches: ExpressionMatch[] = [];
  for (const entry of publicTexts) {
    const normalized = normalizeExpression(entry.text);
    for (let index = 0; index <= normalized.length - windowLength; index += 1) {
      const window = normalized.slice(index, index + windowLength);
      if (!privateNormalized.includes(window)) continue;
      matches.push({
        publicId: entry.id,
        fingerprint: hash64(window),
        windowLength,
      });
      break;
    }
  }
  return matches;
}

export interface EvidenceDiff {
  added: string[];
  changed: string[];
  removed: string[];
  impactedMetricKeys: string[];
  updateQueue: EvidenceUpdateQueueEntry[];
}

export interface EvidenceUpdateQueueEntry {
  logicalKey: string;
  changeType: "added" | "changed" | "removed";
  currentEvidenceId?: string;
  previousEvidenceId?: string;
  metricKeys: string[];
  contentRoles: string[];
  requiredActions: string[];
}

type LogicalEvidence = Pick<JapanZueCandidate, "id" | "source">;

function fallbackSequence(candidate: LogicalEvidence): string {
  const suffix = candidate.id.match(/-(?:table|figure|textstat)(\d+)$/)?.[1];
  return suffix ?? "01";
}

/** Edition prefixを除いた論理キー。表・図番号を優先し、番号なし候補はpage内sequenceで照合する。 */
export function evidenceLogicalKey(candidate: LogicalEvidence): string {
  const { chapter, itemNumber, kind, page } = candidate.source;
  if (itemNumber) return `${kind}:chapter-${chapter ?? "unknown"}:item-${itemNumber}`;
  return `${kind}:chapter-${chapter ?? "unknown"}:page-${String(page).padStart(3, "0")}:seq-${fallbackSequence(candidate)}`;
}

export function diffEvidenceInventory(
  currentCandidates: readonly JapanZueCandidate[],
  previousCandidates: readonly JapanZueCandidate[],
  currentItems: readonly JapanZueEvidenceItem[],
): EvidenceDiff {
  const currentByLogicalKey = new Map(currentCandidates.map((candidate) => [evidenceLogicalKey(candidate), candidate]));
  const previousByLogicalKey = new Map(previousCandidates.map((candidate) => [evidenceLogicalKey(candidate), candidate]));
  const addedKeys = [...currentByLogicalKey.keys()].filter((key) => !previousByLogicalKey.has(key)).sort();
  const removedKeys = [...previousByLogicalKey.keys()].filter((key) => !currentByLogicalKey.has(key)).sort();
  const changedKeys = [...currentByLogicalKey.keys()]
    .filter((key) => {
      const previous = previousByLogicalKey.get(key);
      return previous && previous.sourceFingerprint !== currentByLogicalKey.get(key)?.sourceFingerprint;
    })
    .sort();
  const added = addedKeys.map((key) => currentByLogicalKey.get(key)?.id).filter((id): id is string => Boolean(id));
  const removed = removedKeys.map((key) => previousByLogicalKey.get(key)?.id).filter((id): id is string => Boolean(id));
  const changed = changedKeys.map((key) => currentByLogicalKey.get(key)?.id).filter((id): id is string => Boolean(id));
  const impactedIds = new Set([...added, ...changed]);
  const impactedMetricKeys = [...new Set(
    currentItems
      .filter(({ id }) => impactedIds.has(id))
      .flatMap(({ mapping }) => mapping.metricKeys ?? []),
  )].sort();
  const currentItemByLogicalKey = new Map(
    currentItems.map((item) => [evidenceLogicalKey(item), item]),
  );
  const queue = (
    changeType: EvidenceUpdateQueueEntry["changeType"],
    logicalKeys: string[],
    requiredActions: string[],
  ): EvidenceUpdateQueueEntry[] => logicalKeys.map((logicalKey) => {
    const current = currentByLogicalKey.get(logicalKey);
    const previous = previousByLogicalKey.get(logicalKey);
    const item = currentItemByLogicalKey.get(logicalKey);
    return {
      logicalKey,
      changeType,
      ...(current ? { currentEvidenceId: current.id } : {}),
      ...(previous ? { previousEvidenceId: previous.id } : {}),
      metricKeys: [...(item?.mapping.metricKeys ?? [])].sort(),
      contentRoles: [...(item?.mapping.contentRoles ?? [])].sort(),
      requiredActions,
    };
  });
  const updateQueue = [
    ...queue("added", addedKeys, ["review-primary-source", "resolve-lineage", "plan-content-if-eligible"]),
    ...queue("changed", changedKeys, ["revalidate-primary-source", "refresh-observations", "review-impacted-content"]),
    ...queue("removed", removedKeys, ["retire-or-remap-lineage", "review-orphan-content"]),
  ].sort((left, right) => left.logicalKey.localeCompare(right.logicalKey) || left.changeType.localeCompare(right.changeType));
  return { added, changed, removed, impactedMetricKeys, updateQueue };
}
