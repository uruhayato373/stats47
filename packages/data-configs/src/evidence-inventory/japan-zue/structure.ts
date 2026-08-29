import {
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueCandidateDocument,
  type JapanZueEvidenceCandidate,
  type JapanZueStructureAudit,
} from "./types";
import type { JapanZueMarkdownPage } from "./extraction";

const TABLE_HEADING_PATTERN = /^\s{0,3}#{1,6}\s*(?:表|table)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)/i;
const FIGURE_HEADING_PATTERN = /^\s{0,3}#{1,6}\s*(?:図|figure)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)/i;

const NORMALIZED_RANGES = [
  [26, 65],
  [66, 105],
  [106, 145],
  [146, 185],
  [186, 223],
  [224, 261],
  [262, 301],
  [302, 341],
  [342, 383],
  [384, 421],
  [422, 463],
  [464, 499],
  [500, 529],
] as const;

type HeadingSignal = JapanZueStructureAudit["unmatchedHeadings"][number];

function duplicateNumbers(values: readonly number[]): number[] {
  const seen = new Set<number>();
  const duplicate = new Set<number>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort((left, right) => left - right);
}

function extractHeadings(pages: readonly JapanZueMarkdownPage[]): HeadingSignal[] {
  const headings: HeadingSignal[] = [];
  for (const page of pages) {
    const lines = page.content.replace(/\r\n/g, "\n").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      for (const [kind, pattern] of [
        ["table", TABLE_HEADING_PATTERN],
        ["figure", FIGURE_HEADING_PATTERN],
      ] as const) {
        const match = pattern.exec(line);
        if (!match?.[1]) continue;
        headings.push({
          page: page.page,
          line: index + 1,
          kind,
          itemNumber: match[1].normalize("NFKC").replace(/[－.]/g, "-"),
        });
      }
    }
  }
  return headings;
}

function candidateCoversHeading(candidate: JapanZueEvidenceCandidate, heading: HeadingSignal): boolean {
  if (candidate.source.kind !== heading.kind || candidate.source.itemNumber !== heading.itemNumber) return false;
  return candidate.source.page === heading.page || (candidate.source.continuationPages ?? []).includes(heading.page);
}

function sequenceGaps(candidates: readonly JapanZueEvidenceCandidate[]): JapanZueStructureAudit["sequenceGaps"] {
  const numbersByKindChapter = new Map<string, Set<number>>();
  for (const candidate of candidates) {
    if (candidate.source.kind !== "table" && candidate.source.kind !== "figure") continue;
    const match = /^(\d+)-(\d+)$/.exec(candidate.source.itemNumber ?? "");
    if (!match) continue;
    const key = `${candidate.source.kind}:${match[1]}`;
    const values = numbersByKindChapter.get(key) ?? new Set<number>();
    values.add(Number(match[2]));
    numbersByKindChapter.set(key, values);
  }
  return [...numbersByKindChapter.entries()]
    .map(([key, values]) => {
      const [kind, chapter] = key.split(":") as ["table" | "figure", string];
      const maximum = Math.max(...values);
      const missingNumbers = Array.from({ length: maximum }, (_, index) => index + 1).filter((value) => !values.has(value));
      return { kind, chapter: Number(chapter), missingNumbers };
    })
    .filter(({ missingNumbers }) => missingNumbers.length > 0)
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.chapter - right.chapter);
}

export function auditJapanZueStructure(
  document: JapanZueCandidateDocument,
  pages: readonly JapanZueMarkdownPage[],
): JapanZueStructureAudit {
  const headings = extractHeadings(pages);
  const candidateCounts = {
    table: document.candidates.filter(({ source }) => source.kind === "table").length,
    figure: document.candidates.filter(({ source }) => source.kind === "figure").length,
    textStat: document.candidates.filter(({ source }) => source.kind === "text-stat").length,
    total: document.candidates.length,
  };
  const headingCounts = {
    table: headings.filter(({ kind }) => kind === "table").length,
    figure: headings.filter(({ kind }) => kind === "figure").length,
    total: headings.length,
  };
  const numberedGroups = new Map<string, JapanZueEvidenceCandidate[]>();
  for (const candidate of document.candidates) {
    if ((candidate.source.kind !== "table" && candidate.source.kind !== "figure") || !candidate.source.itemNumber) continue;
    const key = `${candidate.source.kind}:${candidate.source.itemNumber}`;
    numberedGroups.set(key, [...(numberedGroups.get(key) ?? []), candidate]);
  }
  const pagesScanned = document.pagesScanned;
  const expectedPages = Array.from(
    { length: document.pageRange.end - document.pageRange.start + 1 },
    (_, index) => document.pageRange.start + index,
  );
  const scannedSet = new Set(pagesScanned);
  const ranges = NORMALIZED_RANGES.map(([pageStart, pageEnd], index) => {
    const rangeCandidates = document.candidates.filter(
      ({ source }) => source.page >= pageStart && source.page <= pageEnd,
    );
    return {
      range: String(index + 1).padStart(2, "0"),
      pageStart,
      pageEnd,
      pagesScanned: pagesScanned.filter((page) => page >= pageStart && page <= pageEnd).length,
      candidates: rangeCandidates.length,
      table: rangeCandidates.filter(({ source }) => source.kind === "table").length,
      figure: rangeCandidates.filter(({ source }) => source.kind === "figure").length,
      textStat: rangeCandidates.filter(({ source }) => source.kind === "text-stat").length,
    };
  });
  const missingPages = expectedPages.filter((page) => !scannedSet.has(page));
  const duplicatePages = duplicateNumbers(pagesScanned);
  const requiredSourcePages = expectedPages;
  const missingSourcePages = requiredSourcePages.filter((page) => !scannedSet.has(page));
  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition: document.edition,
    pageCoverage: {
      expectedStart: document.pageRange.start,
      expectedEnd: document.pageRange.end,
      expectedCount: expectedPages.length,
      scannedCount: new Set(pagesScanned).size,
      missingPages,
      duplicatePages,
    },
    sourceScope: {
      requiredStart: document.pageRange.start,
      requiredEnd: document.pageRange.end,
      excludedRanges: [
        {
          start: 1,
          end: 25,
          reason: "outside-stats47-prefecture-content-scope",
        },
      ],
      availableStart: Math.min(...pagesScanned),
      availableEnd: Math.max(...pagesScanned),
      missingPages: missingSourcePages,
      isComplete: missingSourcePages.length === 0,
    },
    headingCounts,
    candidateCounts,
    ranges,
    unmatchedHeadings: headings.filter(
      (heading) => !document.candidates.some((candidate) => candidateCoversHeading(candidate, heading)),
    ),
    unnumberedCandidateIds: document.candidates
      .filter(
        ({ source }) => (source.kind === "table" || source.kind === "figure") && source.itemNumber === undefined,
      )
      .map(({ id }) => id)
      .sort(),
    duplicateItemNumbers: [...numberedGroups.entries()]
      .filter(([, values]) => values.length > 1)
      .map(([key, values]) => {
        const [kind, itemNumber] = key.split(":") as ["table" | "figure", string];
        return { kind, itemNumber, ids: values.map(({ id }) => id).sort() };
      })
      .sort((left, right) => left.kind.localeCompare(right.kind) || left.itemNumber.localeCompare(right.itemNumber)),
    sequenceGaps: sequenceGaps(document.candidates),
    isPageCoverageClean: missingPages.length === 0 && duplicatePages.length === 0,
    isSourceScopeComplete: missingSourcePages.length === 0,
  };
}
