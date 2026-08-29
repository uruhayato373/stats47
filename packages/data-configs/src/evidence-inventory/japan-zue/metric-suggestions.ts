import type { JapanZueMarkdownPage } from "./extraction";
import {
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueEvidenceCandidate,
  type JapanZueMetricSuggestionReport,
  type JapanZueReviewQueue,
  type JapanZueSourceSuggestionReport,
} from "./types";

export type JapanZueMetricSearchDocument = {
  key: string;
  title: string;
  subtitle?: string;
  surveyIds?: string[];
};

const MIN_SUGGESTION_SCORE = 0.42;
const HIGH_CONFIDENCE_SCORE = 0.97;
const MAX_MATCHES_PER_GROUP = 5;
const MARKDOWN_PATTERN = /<[^>]+>|[*_`#｜|]/g;
const NOISE_PATTERN = /(?:都道府県別|国別|地域別|主要|一覧|推移|構成|割合|比率|現在|年度|年版|単位|統計|データ|表|図)/g;

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(MARKDOWN_PATTERN, "")
    .replace(NOISE_PATTERN, "")
    .replace(/[\s\d０-９.,，。:：;；()（）［］\[\]「」『』・/％%+-]+/g, "")
    .toLowerCase();
}

function ngrams(value: string, size: number): Set<string> {
  if (value.length < size) return new Set(value ? [value] : []);
  return new Set(Array.from({ length: value.length - size + 1 }, (_, index) => value.slice(index, index + size)));
}

function dice(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return (2 * intersection) / (left.size + right.size);
}

type SearchSignature = {
  normalized: string;
  bigrams: Set<string>;
  trigrams: Set<string>;
};

function signature(value: string): SearchSignature {
  const normalized = normalize(value);
  return { normalized, bigrams: ngrams(normalized, 2), trigrams: ngrams(normalized, 3) };
}

function similarity(left: SearchSignature, right: SearchSignature): number {
  const normalizedLeft = left.normalized;
  const normalizedRight = right.normalized;
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (normalizedRight.length >= 3 && normalizedLeft.includes(normalizedRight)) return 0.92;
  const bigram = dice(left.bigrams, right.bigrams);
  const trigram = dice(left.trigrams, right.trigrams);
  return Math.max(bigram * 0.65 + trigram * 0.35, bigram * 0.85);
}

function sourceText(
  candidate: JapanZueEvidenceCandidate,
  page: JapanZueMarkdownPage,
): string {
  const lines = page.content.replace(/\r\n/g, "\n").split("\n");
  if (candidate.source.kind === "text-stat") return lines[candidate.locator.lineStart - 1] ?? "";
  for (let index = candidate.locator.lineStart - 2; index >= Math.max(0, candidate.locator.lineStart - 16); index -= 1) {
    const line = lines[index] ?? "";
    if (/^\s{0,3}#{1,6}\s*/.test(line)) return line;
  }
  return "";
}

export function suggestJapanZueMetricMatches(
  queue: JapanZueReviewQueue,
  candidates: readonly JapanZueEvidenceCandidate[],
  pages: readonly JapanZueMarkdownPage[],
  metrics: readonly JapanZueMetricSearchDocument[],
  sourceSuggestions?: JapanZueSourceSuggestionReport,
): JapanZueMetricSuggestionReport {
  const pagesByNumber = new Map(pages.map((page) => [page.page, page]));
  const metricTexts = metrics.map((metric) => ({
    key: metric.key,
    signature: signature([metric.title, metric.subtitle].filter(Boolean).join(" ")),
    surveyIds: new Set(metric.surveyIds ?? []),
  }));
  const reviewGroupByCandidate = new Map(
    queue.groups.flatMap((group) => group.candidateIds.map((candidateId) => [candidateId, group.id] as const)),
  );
  const surveyIdsByGroup = new Map(
    (sourceSuggestions?.suggestions ?? []).map(({ reviewGroupId, surveyIds }) => [reviewGroupId, new Set(surveyIds)]),
  );
  let sourceConstrainedCandidateCount = 0;
  const suggestions = candidates.flatMap((candidate) => {
    const page = pagesByNumber.get(candidate.source.page);
    const reviewGroupId = reviewGroupByCandidate.get(candidate.id);
    if (!page || !reviewGroupId) return [];
    const text = signature(sourceText(candidate, page));
    const sourceSurveyIds = surveyIdsByGroup.get(reviewGroupId);
    const compatibleMetrics = sourceSurveyIds
      ? metricTexts.filter(({ surveyIds }) => [...sourceSurveyIds].some((surveyId) => surveyIds.has(surveyId)))
      : metricTexts;
    if (sourceSurveyIds && compatibleMetrics.length > 0) sourceConstrainedCandidateCount += 1;
    const matches = compatibleMetrics
      .map(({ key, signature: metricSignature }) => ({
        metricKey: key,
        score: similarity(text, metricSignature),
        sourceCompatible: sourceSurveyIds !== undefined,
      }))
      .filter(({ score }) => score >= MIN_SUGGESTION_SCORE)
      .sort((left, right) => right.score - left.score || left.metricKey.localeCompare(right.metricKey))
      .slice(0, MAX_MATCHES_PER_GROUP)
      .map(({ metricKey, score, sourceCompatible }) => ({
        metricKey,
        score: Math.round(score * 1000) / 1000,
        sourceCompatible,
      }));
    return matches.length > 0 ? [{ candidateId: candidate.id, reviewGroupId, matches }] : [];
  });
  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition: queue.edition,
    candidateCount: candidates.length,
    sourceConstrainedCandidateCount,
    suggestedCandidateCount: suggestions.length,
    highConfidenceCandidateCount: suggestions.filter(({ matches }) => (matches[0]?.score ?? 0) >= HIGH_CONFIDENCE_SCORE).length,
    suggestions,
  };
}
