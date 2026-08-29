import { createHash } from "node:crypto";

import {
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueEvidenceCandidate,
  type JapanZueReviewGroup,
  type JapanZueReviewQueue,
} from "./types";
import type { JapanZueMarkdownPage } from "./extraction";

type CitationEvidence =
  | { kind: "direct"; citationSha256: string; locator: { markdownPath: string; line: number } }
  | { kind: "reference"; targetCandidateId?: string; referenceSha256: string }
  | { kind: "context"; contextKey: string };

type CanonicalEvidence =
  | { key: string; kind: "direct-citation"; citationSha256: string; locator: { markdownPath: string; line: number } }
  | { key: string; kind: "unresolved-reference"; unresolvedReferenceSha256: string }
  | { key: string; kind: "local-context" };

const EXPLICIT_REFERENCE_PATTERN = /(?:資料|出典|出所)?[^。\n]{0,24}(表|図)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)(?:\s*(?:に|と))?\s*(?:同じ|参照|による|より作成)/;
const RELATIVE_REFERENCE_PATTERN = /(?:資料|出典|出所)?[^。\n]{0,24}(上|下|前)(表|図)(?:\s*(?:に|と))?\s*(?:同じ|参照|による|より作成)/;
const DIRECT_CITATION_PATTERN = /(?:より(?:作成|転載)|を(?:基|もと)に作成|による(?:。|$)|^\s*(?:出典|出所)\s*[:：])/;
const PUBLICATION_TITLE_PATTERN = /[「『][^」』]{2,120}(?:統計|調査|年鑑|白書|報告|データ)[^」』]*[」』]/;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeLine(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function normalizeCitationIdentity(value: string): string {
  const normalized = normalizeLine(value);
  const markerIndex = normalized.search(DIRECT_CITATION_PATTERN);
  const prefix = markerIndex >= 0 ? normalized.slice(0, markerIndex) : normalized;
  return prefix
    .replace(/(?:19|20)\d{2}年(?:度|版)?/g, "YEAR")
    .replace(/(?:19|20)\d{2}[./-]\d{1,2}(?:[./-]\d{1,2})?/g, "DATE")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

function referenceTarget(
  line: string,
  candidate: JapanZueEvidenceCandidate,
  anchors: readonly JapanZueEvidenceCandidate[],
): { targetCandidateId?: string; referenceSha256: string } | undefined {
  const normalized = normalizeLine(line);
  const explicit = EXPLICIT_REFERENCE_PATTERN.exec(normalized);
  if (explicit?.[1] && explicit[2]) {
    const kind = explicit[1] === "表" ? "table" : "figure";
    const itemNumber = explicit[2].normalize("NFKC").replace(/[－.]/g, "-");
    const target = anchors
      .filter((entry) => entry.source.kind === kind && entry.source.itemNumber === itemNumber && entry.id !== candidate.id)
      .sort((left, right) => {
        const pageDistance = Math.abs(left.source.page - candidate.source.page) - Math.abs(right.source.page - candidate.source.page);
        if (pageDistance !== 0) return pageDistance;
        const leftAfter = left.source.page > candidate.source.page ? 1 : 0;
        const rightAfter = right.source.page > candidate.source.page ? 1 : 0;
        return leftAfter - rightAfter || left.id.localeCompare(right.id);
      })[0];
    return { ...(target ? { targetCandidateId: target.id } : {}), referenceSha256: sha256(normalized) };
  }

  const relative = RELATIVE_REFERENCE_PATTERN.exec(normalized);
  if (!relative?.[1] || !relative[2]) return undefined;
  const kind = relative[2] === "表" ? "table" : "figure";
  const ordered = anchors.filter((entry) => entry.source.kind === kind && entry.id !== candidate.id);
  const target = relative[1] === "下"
    ? ordered.find((entry) => entry.source.page > candidate.source.page || (entry.source.page === candidate.source.page && entry.locator.lineStart > candidate.locator.lineStart))
    : [...ordered].reverse().find((entry) => entry.source.page < candidate.source.page || (entry.source.page === candidate.source.page && entry.locator.lineStart < candidate.locator.lineStart));
  return { ...(target ? { targetCandidateId: target.id } : {}), referenceSha256: sha256(normalized) };
}

function findEvidence(
  page: JapanZueMarkdownPage,
  candidate: JapanZueEvidenceCandidate,
  windowEnd: number,
  anchors: readonly JapanZueEvidenceCandidate[],
): CitationEvidence | undefined {
  const lines = page.content.replace(/\r\n/g, "\n").split("\n");
  for (let lineNumber = candidate.locator.lineEnd + 1; lineNumber <= windowEnd; lineNumber += 1) {
    const line = lines[lineNumber - 1] ?? "";
    const normalized = normalizeLine(line);
    if (!normalized) continue;
    const referenceIndex = [normalized.search(EXPLICIT_REFERENCE_PATTERN), normalized.search(RELATIVE_REFERENCE_PATTERN)]
      .filter((index) => index >= 0)
      .sort((left, right) => left - right)[0] ?? -1;
    const directIndex = normalized.search(DIRECT_CITATION_PATTERN);
    if ((directIndex >= 0 && (referenceIndex < 0 || directIndex < referenceIndex)) || (referenceIndex < 0 && PUBLICATION_TITLE_PATTERN.test(normalized))) {
      return {
        kind: "direct",
        citationSha256: sha256(normalizeCitationIdentity(normalized)),
        locator: { markdownPath: page.markdownPath, line: lineNumber },
      };
    }
    const reference = referenceTarget(line, candidate, anchors);
    if (reference) return { kind: "reference", ...reference };
    if (directIndex >= 0 || PUBLICATION_TITLE_PATTERN.test(normalized)) {
      return {
        kind: "direct",
        citationSha256: sha256(normalizeCitationIdentity(normalized)),
        locator: { markdownPath: page.markdownPath, line: lineNumber },
      };
    }
  }
  return undefined;
}

function nearestHeadingLine(page: JapanZueMarkdownPage, beforeLine: number): number | undefined {
  const lines = page.content.replace(/\r\n/g, "\n").split("\n");
  for (let lineNumber = beforeLine - 1; lineNumber >= 1; lineNumber -= 1) {
    if (/^\s{0,3}#{1,6}\s+/.test(lines[lineNumber - 1] ?? "")) return lineNumber;
  }
  return undefined;
}

function canonicalEvidence(
  candidateId: string,
  evidenceByCandidate: ReadonlyMap<string, CitationEvidence>,
  visited: ReadonlySet<string> = new Set(),
): CanonicalEvidence {
  const evidence = evidenceByCandidate.get(candidateId);
  if (!evidence || evidence.kind === "context") {
    const contextKey = evidence?.kind === "context" ? evidence.contextKey : candidateId;
    return { key: `context:${contextKey}`, kind: "local-context" };
  }
  if (evidence.kind === "direct") {
    return {
      key: `citation:${evidence.citationSha256}`,
      kind: "direct-citation",
      citationSha256: evidence.citationSha256,
      locator: evidence.locator,
    };
  }
  if (!evidence.targetCandidateId || visited.has(evidence.targetCandidateId)) {
    return {
      key: `unresolved-reference:${evidence.referenceSha256}`,
      kind: "unresolved-reference",
      unresolvedReferenceSha256: evidence.referenceSha256,
    };
  }
  return canonicalEvidence(
    evidence.targetCandidateId,
    evidenceByCandidate,
    new Set([...visited, candidateId]),
  );
}

export function buildJapanZueReviewQueue(
  candidates: readonly JapanZueEvidenceCandidate[],
  pages: readonly JapanZueMarkdownPage[],
  edition: string,
): JapanZueReviewQueue {
  const pagesByNumber = new Map(pages.map((page) => [page.page, page]));
  const anchors = candidates
    .filter(({ source }) => source.kind === "table" || source.kind === "figure")
    .sort((left, right) => left.source.page - right.source.page || left.locator.lineStart - right.locator.lineStart);
  const evidenceByCandidate = new Map<string, CitationEvidence>();

  for (const anchor of anchors) {
    const page = pagesByNumber.get(anchor.source.page);
    if (!page) continue;
    const nextAnchor = anchors.find(
      (entry) => entry.source.page === anchor.source.page && entry.locator.lineStart > anchor.locator.lineStart,
    );
    const lineCount = page.content.replace(/\r\n/g, "\n").split("\n").length;
    const windowEnd = nextAnchor ? nextAnchor.locator.lineStart - 1 : lineCount;
    let evidence = findEvidence(page, anchor, windowEnd, anchors);
    for (const continuationPage of anchor.source.continuationPages ?? []) {
      if (evidence) break;
      const continuation = pagesByNumber.get(continuationPage);
      if (!continuation) continue;
      const continuationLineCount = continuation.content.replace(/\r\n/g, "\n").split("\n").length;
      evidence = findEvidence(
        continuation,
        {
          ...anchor,
          source: { ...anchor.source, page: continuationPage },
          locator: { markdownPath: continuation.markdownPath, lineStart: 0, lineEnd: 0 },
        },
        continuationLineCount,
        anchors,
      );
    }
    evidenceByCandidate.set(anchor.id, evidence ?? { kind: "context", contextKey: anchor.id });
  }

  for (const candidate of candidates.filter(({ source }) => source.kind === "text-stat")) {
    const page = pagesByNumber.get(candidate.source.page);
    if (!page) {
      evidenceByCandidate.set(candidate.id, { kind: "context", contextKey: candidate.id });
      continue;
    }
    const pageAnchors = anchors.filter(({ source }) => source.page === candidate.source.page);
    const nextAnchor = pageAnchors.find((entry) => entry.locator.lineStart > candidate.locator.lineStart);
    const previousAnchor = [...pageAnchors]
      .reverse()
      .find((entry) => entry.locator.lineStart < candidate.locator.lineStart);
    const windowEnd = nextAnchor ? nextAnchor.locator.lineStart - 1 : page.content.replace(/\r\n/g, "\n").split("\n").length;
    const direct = findEvidence(page, candidate, windowEnd, anchors);
    if (direct) {
      evidenceByCandidate.set(candidate.id, direct);
      continue;
    }
    const headingLine = nearestHeadingLine(page, candidate.locator.lineStart);
    const crossesHeading =
      previousAnchor !== undefined && headingLine !== undefined && headingLine > previousAnchor.locator.lineEnd;
    const inherited = previousAnchor ? evidenceByCandidate.get(previousAnchor.id) : undefined;
    if (!crossesHeading && inherited && inherited.kind !== "context") {
      evidenceByCandidate.set(candidate.id, inherited);
      continue;
    }
    evidenceByCandidate.set(candidate.id, {
      kind: "context",
      contextKey: headingLine
        ? `p${String(candidate.source.page).padStart(3, "0")}-h${String(headingLine).padStart(3, "0")}`
        : previousAnchor?.id ?? `p${String(candidate.source.page).padStart(3, "0")}-body`,
    });
  }

  const groupsByKey = new Map<string, { canonical: CanonicalEvidence; candidates: JapanZueEvidenceCandidate[] }>();
  for (const candidate of candidates) {
    const canonical = canonicalEvidence(candidate.id, evidenceByCandidate);
    const existing = groupsByKey.get(canonical.key);
    groupsByKey.set(canonical.key, {
      canonical,
      candidates: [...(existing?.candidates ?? []), candidate],
    });
  }

  const groups: JapanZueReviewGroup[] = [...groupsByKey.values()]
    .map(({ canonical, candidates: groupCandidates }) => {
      const chapters = [...new Set(groupCandidates.map(({ source }) => source.chapter).filter((value): value is number => value !== undefined))];
      const referenceCandidateIds = groupCandidates
        .filter(({ id }) => evidenceByCandidate.get(id)?.kind === "reference")
        .map(({ id }) => id)
        .sort();
      return {
        id: `japan-zue-review-${sha256(canonical.key)}`,
        ...(chapters.length === 1 ? { chapter: chapters[0] } : {}),
        candidateIds: groupCandidates.map(({ id }) => id).sort(),
        referenceCandidateIds,
        evidence: {
          kind: canonical.kind,
          ...(canonical.kind === "direct-citation"
            ? { citationSha256: canonical.citationSha256, locator: canonical.locator }
            : {}),
          ...(canonical.kind === "unresolved-reference"
            ? { unresolvedReferenceSha256: canonical.unresolvedReferenceSha256 }
            : {}),
        },
      };
    })
    .sort((left, right) => left.candidateIds[0]!.localeCompare(right.candidateIds[0]!));

  const groupedCandidateIds = groups.flatMap(({ candidateIds }) => candidateIds);
  const candidateIds = candidates.map(({ id }) => id);
  const groupedSet = new Set(groupedCandidateIds);
  const directGroups = groups.filter(({ evidence }) => evidence.kind === "direct-citation");
  const localGroups = groups.filter(({ evidence }) => evidence.kind === "local-context");
  const duplicateCandidateIds = duplicates(groupedCandidateIds);
  const missingCandidateIds = candidateIds.filter((id) => !groupedSet.has(id)).sort();
  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition,
    candidateCount: candidateIds.length,
    groupedCandidateCount: groupedSet.size,
    groupCount: groups.length,
    directCitationGroupCount: directGroups.length,
    directCitationCandidateCount: directGroups.reduce((total, group) => total + group.candidateIds.length, 0),
    referenceCandidateCount: groups.reduce((total, group) => total + group.referenceCandidateIds.length, 0),
    unresolvedReferenceGroupCount: groups.filter(({ evidence }) => evidence.kind === "unresolved-reference").length,
    localContextGroupCount: localGroups.length,
    localContextCandidateCount: localGroups.reduce((total, group) => total + group.candidateIds.length, 0),
    duplicateCandidateIds,
    missingCandidateIds,
    groups,
    isComplete: groupedSet.size === candidateIds.length && duplicateCandidateIds.length === 0 && missingCandidateIds.length === 0,
  };
}
