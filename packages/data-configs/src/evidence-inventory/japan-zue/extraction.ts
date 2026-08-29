import { createHash } from "node:crypto";

import {
  JAPAN_ZUE_EDITION,
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueEvidenceCandidate,
  type JapanZueEvidenceKind,
} from "./types";

export type JapanZueMarkdownPage = {
  page: number;
  markdownPath: string;
  content: string;
};

type RawCandidate = Omit<JapanZueEvidenceCandidate, "id" | "source"> & {
  page: number;
  chapter?: number;
  kind: JapanZueEvidenceKind;
  itemNumber?: string;
  sequenceHint?: number;
  touchesPageStart: boolean;
  touchesPageEnd: boolean;
  explicitContinuation: boolean;
};

type MergedRawCandidate = RawCandidate & {
  continuationPages?: number[];
  lastFragmentPage: number;
};

const TABLE_SEPARATOR_PATTERN = /^\s*\|?\s*:?-{3,}/;
const FIGURE_LINE_PATTERN = /^(?:\s{0,3}#{1,6}\s*)?(?:図|figure)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)/i;
const IMAGE_PATTERN = /!\[[^\]]*]\([^)]*\)/;
const QUANTITATIVE_PATTERN = /(?:\d[\d,.]*\s*(?:%|％|人|円|件|戸|台|社|校|床|ha|km|トン|t|倍|歳|年|月|日)|(?:人口|割合|比率|件数|総数|平均|指数|増加|減少)[^\n]{0,24}\d)/i;
const FIGURE_DESCRIPTION_PATTERN = /(?:縦軸|横軸|左目盛|右目盛|系列\s*(?:は|[:：])|凡例|折れ線|棒グラフ|人口ピラミッド|左図\s*[:：]|右図\s*[:：])/i;
const TABLE_TRANSCRIPTION_PATTERN =
  /^(?:(?:※\s*)?(?:原表は|原表では|[^。\n]{0,30}原表で)[^\n]{0,160}(?:段組|列構成|欄組|ブロック|中(?:括弧|かっこ)|くくられ|まとめられ)|男・女(?:・[^の\n]{1,40})?の(?:各)?欄は[^\n]{0,80}(?:内訳|原表))/;
const TABLE_NUMBER_PATTERN = /(?:表|table)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)/i;
const TABLE_HEADING_NUMBER_PATTERN = /^\s{0,3}#{1,6}\s*(?:表|table)\s*([0-9０-９]+(?:[-－.][0-9０-９]+)*)/i;
const PROVENANCE_OR_NOTE_PATTERN = /^\s*(?:出典|出所|資料|注(?:記)?|備考|単位|source)\s*[:：]?/i;
const SOURCE_CITATION_PATTERN = /(?:より(?:作成|転載)|を(?:基|もと)に作成|による(?:。|$))/;
const CHAPTER_PATTERN = /第\s*([0-9０-９]{1,2})\s*章/;
const APPENDIX_PATTERN = /(?:付録|主要長期統計|府県別主要統計|府県別生産統計)/;
const INDEX_PAGE_PATTERN = /^(?:#\s*索引(?:\(つづき\))?|#\s*p\.\s*\d+\s*\(索引\))\s*$/m;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeForDigest(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function stableId(page: number, kind: JapanZueEvidenceKind, sequence: number, edition: string): string {
  const kindSegment = kind === "text-stat" ? "textstat" : kind;
  return `${JAPAN_ZUE_SOURCE_KEY}-${edition}-p${String(page).padStart(3, "0")}-${kindSegment}${String(sequence).padStart(2, "0")}`;
}

function findTableRanges(lines: readonly string[]): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let cursor = 0;
  while (cursor < lines.length) {
    if (!lines[cursor]?.includes("|")) {
      cursor += 1;
      continue;
    }
    const start = cursor;
    while (cursor < lines.length && lines[cursor]?.includes("|")) cursor += 1;
    const block = lines.slice(start, cursor);
    if (block.length >= 2 && block.some((line) => TABLE_SEPARATOR_PATTERN.test(line))) {
      ranges.push({ start, end: cursor - 1 });
    }
  }
  return ranges;
}

function precedingTableHeading(
  lines: readonly string[],
  start: number,
): { itemNumber?: string; isContinuation: boolean } {
  for (let index = start - 1; index >= 0; index -= 1) {
    const line = lines[index] ?? "";
    const match = TABLE_HEADING_NUMBER_PATTERN.exec(line);
    if (match?.[1]) return { itemNumber: match[1].normalize("NFKC"), isContinuation: false };
    const heading = /^\s{0,3}(#{1,6})\s*/.exec(line);
    if (heading && heading[1]!.length <= 2) {
      const normalized = line.normalize("NFKC");
      return {
        isContinuation:
          /^\s{0,3}#{1,6}\s*表/.test(normalized) &&
          /(?:\((?:II|III|IV|V|VI|VII|VIII|IX|X)\)|つづき|続き)/i.test(normalized),
      };
    }
  }
  return { isContinuation: false };
}

function followsFigureHeading(lines: readonly string[], index: number): boolean {
  for (let previous = index - 1; previous >= Math.max(0, index - 3); previous -= 1) {
    const line = (lines[previous] ?? "").trim();
    if (line.length === 0) continue;
    return FIGURE_LINE_PATTERN.test(line);
  }
  return false;
}

function isFigureDescriptionLine(lines: readonly string[], index: number): boolean {
  const line = (lines[index] ?? "").normalize("NFKC");
  let followsImage = false;
  for (let previous = index - 1; previous >= 0; previous -= 1) {
    const preceding = (lines[previous] ?? "").trim();
    if (IMAGE_PATTERN.test(preceding)) followsImage = true;
    if (/^\s{0,3}#{1,6}\s*/.test(preceding)) {
      if (/^\s{0,3}#{1,6}\s*図の説明/.test(preceding)) return true;
      return followsImage && (FIGURE_LINE_PATTERN.test(preceding) || FIGURE_DESCRIPTION_PATTERN.test(line));
    }
  }
  return followsImage && FIGURE_DESCRIPTION_PATTERN.test(line);
}

function extractRawCandidates(page: JapanZueMarkdownPage, chapter?: number): RawCandidate[] {
  if (INDEX_PAGE_PATTERN.test(page.content.normalize("NFKC"))) return [];
  const lines = page.content.replace(/\r\n/g, "\n").split("\n");
  const nonBlank = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.trim().length > 0);
  const firstContentLine = nonBlank[0]?.index ?? 0;
  const lastContentLine = nonBlank[nonBlank.length - 1]?.index ?? 0;
  const tableRanges = findTableRanges(lines);
  const tableLineIndexes = new Set(tableRanges.flatMap(({ start, end }) => Array.from({ length: end - start + 1 }, (_, offset) => start + offset)));
  const raw: RawCandidate[] = [];

  for (const range of tableRanges) {
    const preceding = lines[Math.max(0, range.start - 1)] ?? "";
    const block = lines.slice(range.start, range.end + 1).join("\n");
    const heading = precedingTableHeading(lines, range.start);
    const itemNumber = heading.itemNumber;
    raw.push({
      page: page.page,
      ...(chapter ? { chapter } : {}),
      kind: "table",
      itemNumber,
      locator: { markdownPath: page.markdownPath, lineStart: range.start + 1, lineEnd: range.end + 1 },
      detection: "markdown-table",
      contentSha256: sha256(normalizeForDigest(`${preceding}\n${block}`)),
      touchesPageStart: range.start <= firstContentLine + 1,
      touchesPageEnd: range.end >= lastContentLine - 1,
      explicitContinuation:
        heading.isContinuation || /table-continuation/i.test(lines[Math.max(0, range.start - 1)] ?? ""),
    });
  }

  const occupiedFigureLines = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const isFigure = IMAGE_PATTERN.test(line) || FIGURE_LINE_PATTERN.test(line.trim());
    if (!isFigure || occupiedFigureLines.has(index)) continue;
    if (IMAGE_PATTERN.test(line) && followsFigureHeading(lines, index)) {
      occupiedFigureLines.add(index);
      continue;
    }
    const numberMatch = FIGURE_LINE_PATTERN.exec(line.trim());
    raw.push({
      page: page.page,
      ...(chapter ? { chapter } : {}),
      kind: "figure",
      itemNumber: numberMatch?.[1]?.normalize("NFKC"),
      locator: { markdownPath: page.markdownPath, lineStart: index + 1, lineEnd: index + 1 },
      detection: "figure-reference",
      contentSha256: sha256(normalizeForDigest(line)),
      touchesPageStart: index <= firstContentLine + 1,
      touchesPageEnd: index >= lastContentLine - 1,
      explicitContinuation: false,
    });
    occupiedFigureLines.add(index);
  }

  let textStatSequence = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (tableLineIndexes.has(index) || IMAGE_PATTERN.test(line) || /^\s{0,3}#/.test(line)) continue;
    if (
      TABLE_NUMBER_PATTERN.test(line) ||
      FIGURE_LINE_PATTERN.test(line.trim()) ||
      PROVENANCE_OR_NOTE_PATTERN.test(line) ||
      SOURCE_CITATION_PATTERN.test(line.normalize("NFKC"))
    ) {
      continue;
    }
    if (!QUANTITATIVE_PATTERN.test(line)) continue;
    textStatSequence += 1;
    if (isFigureDescriptionLine(lines, index) || TABLE_TRANSCRIPTION_PATTERN.test(line.normalize("NFKC"))) continue;
    raw.push({
      page: page.page,
      ...(chapter ? { chapter } : {}),
      kind: "text-stat",
      sequenceHint: textStatSequence,
      locator: { markdownPath: page.markdownPath, lineStart: index + 1, lineEnd: index + 1 },
      detection: "quantitative-sentence",
      contentSha256: sha256(normalizeForDigest(line)),
      touchesPageStart: index <= firstContentLine + 1,
      touchesPageEnd: index >= lastContentLine - 1,
      explicitContinuation: false,
    });
  }

  return raw.sort((left, right) => left.locator.lineStart - right.locator.lineStart || left.kind.localeCompare(right.kind));
}

function materialize(raw: RawCandidate[], edition: string): JapanZueEvidenceCandidate[] {
  const sequenceByPageKind = new Map<string, number>();
  return raw.map((candidate) => {
    const sequenceKey = `${candidate.page}:${candidate.kind}`;
    const sequence = candidate.sequenceHint ?? (sequenceByPageKind.get(sequenceKey) ?? 0) + 1;
    sequenceByPageKind.set(sequenceKey, Math.max(sequenceByPageKind.get(sequenceKey) ?? 0, sequence));
    return {
      id: stableId(candidate.page, candidate.kind, sequence, edition),
      source: {
        key: JAPAN_ZUE_SOURCE_KEY,
        edition,
        ...(candidate.chapter ? { chapter: candidate.chapter } : {}),
        page: candidate.page,
        kind: candidate.kind,
        ...(candidate.itemNumber ? { itemNumber: candidate.itemNumber } : {}),
      },
      locator: candidate.locator,
      detection: candidate.detection,
      contentSha256: candidate.contentSha256,
    };
  });
}

/**
 * 同じ入力に対して順序・ID・件数が安定する決定的 extractor。
 * 明示markerまたはページ境界の連続tableだけを開始ページへ統合する。
 */
export function extractJapanZueCandidates(
  pages: readonly JapanZueMarkdownPage[],
  edition: string = JAPAN_ZUE_EDITION,
): JapanZueEvidenceCandidate[] {
  if (!/^\d{4}-\d{2}$/.test(edition)) throw new Error(`Invalid Japan Zue edition: ${edition}`);
  const sortedPages = [...pages].sort((left, right) => left.page - right.page);
  let currentChapter: number | undefined;
  const rawByPage = sortedPages.map((page) => {
    const normalized = page.content.normalize("NFKC");
    const chapterMatch = CHAPTER_PATTERN.exec(normalized);
    if (APPENDIX_PATTERN.test(normalized) || INDEX_PAGE_PATTERN.test(normalized)) currentChapter = undefined;
    if (chapterMatch?.[1]) currentChapter = Number(chapterMatch[1]);
    return { page: page.page, candidates: extractRawCandidates(page, currentChapter) };
  });
  const merged: MergedRawCandidate[] = [];
  const activeTableByNumber = new Map<string, number>();
  let lastTableIndex: number | undefined;

  for (const current of rawByPage) {
    for (const candidate of current.candidates) {
      if (candidate.kind !== "table") {
        merged.push({ ...candidate, lastFragmentPage: candidate.page });
        continue;
      }

      const numberedIndex = candidate.itemNumber ? activeTableByNumber.get(candidate.itemNumber) : undefined;
      const numberedActive = numberedIndex === undefined ? undefined : merged[numberedIndex];
      const lastActive = lastTableIndex === undefined ? undefined : merged[lastTableIndex];
      const numberedContinuation =
        numberedActive?.kind === "table" && candidate.page <= numberedActive.lastFragmentPage + 1;
      const boundaryContinuation =
        candidate.itemNumber === undefined &&
        lastActive?.kind === "table" &&
        (candidate.explicitContinuation ||
          (candidate.page === lastActive.lastFragmentPage + 1 && lastActive.touchesPageEnd && candidate.touchesPageStart));
      const activeIndex = numberedContinuation ? numberedIndex : boundaryContinuation ? lastTableIndex : undefined;
      const active = activeIndex === undefined ? undefined : merged[activeIndex];
      if (activeIndex === undefined || !active || active.kind !== "table") {
        const next = { ...candidate, lastFragmentPage: candidate.page };
        merged.push(next);
        lastTableIndex = merged.length - 1;
        if (candidate.itemNumber) activeTableByNumber.set(candidate.itemNumber, lastTableIndex);
        continue;
      }

      if (!active.itemNumber && candidate.itemNumber) active.itemNumber = candidate.itemNumber;
      if (candidate.page === active.page) {
        active.locator.lineEnd = candidate.locator.lineEnd;
      } else if (!(active.continuationPages ?? []).includes(candidate.page)) {
        active.continuationPages = [...(active.continuationPages ?? []), candidate.page];
      }
      active.contentSha256 = sha256(`${active.contentSha256}:${candidate.contentSha256}`);
      active.lastFragmentPage = candidate.page;
      lastTableIndex = activeIndex;
      if (active.itemNumber) activeTableByNumber.set(active.itemNumber, activeIndex);
    }
  }

  const materialized = materialize(merged, edition);
  return materialized.map((candidate, index) => {
    const raw = merged[index];
    if (!raw.continuationPages || raw.continuationPages.length === 0) return candidate;
    return { ...candidate, source: { ...candidate.source, continuationPages: raw.continuationPages } };
  });
}
