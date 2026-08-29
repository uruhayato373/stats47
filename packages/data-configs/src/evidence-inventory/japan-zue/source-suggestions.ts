import { createHash } from "node:crypto";

import { DISPLAYNAME_TO_SURVEY } from "../../ssds/displayname-to-survey";
import { KNOWN_SOURCE_TO_SURVEY, PROPOSED_NEW_SURVEYS } from "../../ssds/source-name-to-survey";
import type { JapanZueMarkdownPage } from "./extraction";
import {
  JAPAN_ZUE_SOURCE_KEY,
  type JapanZueReviewQueue,
  type JapanZueSourceSuggestionReport,
  type JapanZueSurveySearchDocument,
} from "./types";

type Alias = {
  normalized: string;
  surveyId: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/(?:19|20)\d{2}年(?:度|版)?/g, "")
    .replace(/[\s\d０-９.,，。:：;；()（）［］\[\]「」『』・/％%+\-‐－]+/g, "")
    .toLowerCase();
}

function buildAliases(surveys: readonly JapanZueSurveySearchDocument[]): {
  aliases: Alias[];
  missingCatalogSurveyIds: string[];
} {
  const surveyIds = new Set(surveys.map(({ id }) => id));
  const raw = [
    ...surveys.map(({ id, name }) => ({ value: name, surveyId: id })),
    ...Object.entries(KNOWN_SOURCE_TO_SURVEY).map(([value, surveyId]) => ({ value, surveyId })),
    ...Object.entries(PROPOSED_NEW_SURVEYS).flatMap(([value, survey]) => [
      { value, surveyId: survey.id },
      { value: survey.name, surveyId: survey.id },
    ]),
    ...Object.entries(DISPLAYNAME_TO_SURVEY).map(([value, surveyId]) => ({ value, surveyId })),
  ];
  const missingCatalogSurveyIds = [...new Set(raw.map(({ surveyId }) => surveyId).filter((id) => !surveyIds.has(id)))].sort();
  const deduped = new Map<string, Alias>();
  for (const { value, surveyId } of raw) {
    if (!surveyIds.has(surveyId)) continue;
    const normalized = normalize(value);
    if (normalized.length < 4) continue;
    deduped.set(`${surveyId}:${normalized}`, { normalized, surveyId });
  }
  return {
    aliases: [...deduped.values()].sort((left, right) => right.normalized.length - left.normalized.length || left.surveyId.localeCompare(right.surveyId)),
    missingCatalogSurveyIds,
  };
}

export function suggestJapanZueSourceMatches(
  queue: JapanZueReviewQueue,
  pages: readonly JapanZueMarkdownPage[],
  surveys: readonly JapanZueSurveySearchDocument[],
): JapanZueSourceSuggestionReport {
  const pagesByPath = new Map(pages.map((page) => [page.markdownPath, page]));
  const { aliases, missingCatalogSurveyIds } = buildAliases(surveys);
  const suggestions: JapanZueSourceSuggestionReport["suggestions"] = [];
  const ambiguousGroupIds: string[] = [];
  const unmatchedDirectGroupIds: string[] = [];

  for (const group of queue.groups.filter(({ evidence }) => evidence.kind === "direct-citation")) {
    const locator = group.evidence.locator;
    const page = locator ? pagesByPath.get(locator.markdownPath) : undefined;
    const line = page && locator ? page.content.replace(/\r\n/g, "\n").split("\n")[locator.line - 1] ?? "" : "";
    const normalizedLine = normalize(line);
    const matches = aliases.filter(({ normalized }) => normalizedLine.includes(normalized));
    if (matches.length === 0) {
      unmatchedDirectGroupIds.push(group.id);
      continue;
    }
    const idsByAlias = new Map<string, Set<string>>();
    for (const match of matches) {
      const ids = idsByAlias.get(match.normalized) ?? new Set<string>();
      ids.add(match.surveyId);
      idsByAlias.set(match.normalized, ids);
    }
    if ([...idsByAlias.values()].some((ids) => ids.size > 1)) {
      ambiguousGroupIds.push(group.id);
      continue;
    }
    const strongestBySurvey = new Map<string, Alias>();
    for (const match of matches) {
      const existing = strongestBySurvey.get(match.surveyId);
      if (!existing || match.normalized.length > existing.normalized.length) strongestBySurvey.set(match.surveyId, match);
    }
    const strongest = [...strongestBySurvey.values()].sort((left, right) => left.surveyId.localeCompare(right.surveyId));
    suggestions.push({
      reviewGroupId: group.id,
      surveyIds: strongest.map(({ surveyId }) => surveyId),
      candidateCount: group.candidateIds.length,
      matchedAliasSha256: strongest.map(({ normalized }) => sha256(normalized)),
      matchMethod: "exact-alias",
    });
  }

  const matchedSurveyCount = new Set(suggestions.flatMap(({ surveyIds }) => surveyIds)).size;
  return {
    schemaVersion: 1,
    sourceKey: JAPAN_ZUE_SOURCE_KEY,
    edition: queue.edition,
    directCitationGroupCount: queue.directCitationGroupCount,
    suggestedGroupCount: suggestions.length,
    suggestedCandidateCount: suggestions.reduce((total, { candidateCount }) => total + candidateCount, 0),
    matchedSurveyCount,
    ambiguousGroupIds: ambiguousGroupIds.sort(),
    unmatchedDirectGroupIds: unmatchedDirectGroupIds.sort(),
    missingCatalogSurveyIds,
    suggestions: suggestions.sort((left, right) => left.reviewGroupId.localeCompare(right.reviewGroupId)),
    isCatalogClean: missingCatalogSurveyIds.length === 0,
  };
}
