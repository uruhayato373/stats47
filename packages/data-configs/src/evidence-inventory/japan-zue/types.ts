export const JAPAN_ZUE_SOURCE_KEY = "japan-zue" as const;
export const JAPAN_ZUE_EDITION = "2025-26" as const;

export const JAPAN_ZUE_EVIDENCE_KINDS = ["table", "figure", "text-stat"] as const;
export type JapanZueEvidenceKind = (typeof JAPAN_ZUE_EVIDENCE_KINDS)[number];

export const JAPAN_ZUE_RESOLUTIONS = [
  "unreviewed",
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
  "context-only",
  "primary-source-unavailable",
  "rights-hold",
  "not-quantitative",
] as const;
export type JapanZueResolution = (typeof JAPAN_ZUE_RESOLUTIONS)[number];

export const JAPAN_ZUE_RIGHTS = ["allowed", "needs-review", "blocked"] as const;
export type JapanZueRights = (typeof JAPAN_ZUE_RIGHTS)[number];

export const JAPAN_ZUE_GEO_SCOPES = [
  "prefecture-set",
  "prefecture",
  "municipality-set",
  "japan",
  "world",
] as const;
export type JapanZueGeoScope = (typeof JAPAN_ZUE_GEO_SCOPES)[number];

export const JAPAN_ZUE_CONTENT_ROLES = [
  "ranking",
  "survey",
  "theme",
  "area",
  "japan",
  "blog",
  "note",
  "youtube",
  "instagram",
  "x",
] as const;
export type JapanZueContentRole = (typeof JAPAN_ZUE_CONTENT_ROLES)[number];

export type JapanZueEvidenceSource = {
  key: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  chapter?: number;
  page: number;
  continuationPages?: number[];
  kind: JapanZueEvidenceKind;
  itemNumber?: string;
};

export type JapanZuePrimarySource = {
  organization: string;
  publicationOrDataset: string;
  datasetId?: string;
  url: string;
  termsUrl?: string;
  dataYears: string[];
  checkedAt: string;
  rights: JapanZueRights;
};

export type JapanZueEvidenceMapping = {
  metricKeys?: string[];
  surveyIds?: string[];
  categoryKey?: string;
  themeSlugs?: string[];
  geoScopes: JapanZueGeoScope[];
  contentRoles?: JapanZueContentRole[];
};

export type JapanZueEvidenceItem = {
  id: string;
  source: JapanZueEvidenceSource;
  /** 書籍見出しの転記ではなく、reviewerが独自に要約した短い論点。 */
  topicHint: string;
  resolution: JapanZueResolution;
  primarySource?: JapanZuePrimarySource;
  primarySources?: readonly JapanZuePrimarySource[];
  mapping?: JapanZueEvidenceMapping;
};

export const JAPAN_ZUE_DETECTIONS = [
  "markdown-table",
  "figure-reference",
  "quantitative-sentence",
] as const;
export type JapanZueDetection = (typeof JAPAN_ZUE_DETECTIONS)[number];

/**
 * Generator output. 書籍本文・見出し・値を保持せず、原本照合に必要な位置とdigestだけを持つ。
 */
export type JapanZueEvidenceCandidate = {
  id: string;
  source: JapanZueEvidenceSource;
  locator: {
    markdownPath: string;
    lineStart: number;
    lineEnd: number;
  };
  detection: JapanZueDetection;
  contentSha256: string;
};

export type JapanZueCandidateDocument = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  sourceBundleSha256: string;
  pageRange: { start: number; end: number };
  pagesScanned: number[];
  candidates: JapanZueEvidenceCandidate[];
};

export type JapanZueCoverageSummary = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  candidateCount: number;
  inventoryCount: number;
  quantitativeItemCount: number;
  resolvedQuantitativeCount: number;
  decisionCoveragePercent: number;
  resolutionCoveragePercent: number;
  resolutionCounts: Record<JapanZueResolution, number>;
  missingInventoryIds: string[];
  orphanInventoryIds: string[];
  duplicateCandidateIds: string[];
  duplicateInventoryIds: string[];
  unreviewedIds: string[];
  productionBlockers: Array<{ id: string; reasons: string[] }>;
  isComplete: boolean;
};

export type JapanZueLineageAudit = {
  missingMetricKeys: Array<{ id: string; key: string }>;
  missingSurveyIds: Array<{ id: string; key: string }>;
  missingThemeSlugs: Array<{ id: string; key: string }>;
  missingCategoryKeys: Array<{ id: string; key: string }>;
  orphanProductionIds: Array<{ id: string; reasons: string[] }>;
  isClean: boolean;
};

export type JapanZueCandidateDiff = {
  previousEdition: string;
  nextEdition: string;
  addedIds: string[];
  removedIds: string[];
  changedIds: string[];
  unchangedIds: string[];
  impacted: Array<{
    id: string;
    metricKeys: string[];
    surveyIds: string[];
    themeSlugs: string[];
    contentRoles: JapanZueContentRole[];
  }>;
};

export type JapanZueStructureAudit = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  pageCoverage: {
    expectedStart: number;
    expectedEnd: number;
    expectedCount: number;
    scannedCount: number;
    missingPages: number[];
    duplicatePages: number[];
  };
  sourceScope: {
    requiredStart: number;
    requiredEnd: number;
    excludedRanges: Array<{
      start: number;
      end: number;
      reason: "outside-stats47-prefecture-content-scope";
    }>;
    availableStart: number;
    availableEnd: number;
    missingPages: number[];
    isComplete: boolean;
  };
  headingCounts: {
    table: number;
    figure: number;
    total: number;
  };
  candidateCounts: {
    table: number;
    figure: number;
    textStat: number;
    total: number;
  };
  ranges: Array<{
    range: string;
    pageStart: number;
    pageEnd: number;
    pagesScanned: number;
    candidates: number;
    table: number;
    figure: number;
    textStat: number;
  }>;
  unmatchedHeadings: Array<{
    page: number;
    line: number;
    kind: "table" | "figure";
    itemNumber: string;
  }>;
  unnumberedCandidateIds: string[];
  duplicateItemNumbers: Array<{
    kind: "table" | "figure";
    itemNumber: string;
    ids: string[];
  }>;
  sequenceGaps: Array<{
    kind: "table" | "figure";
    chapter: number;
    missingNumbers: number[];
  }>;
  isPageCoverageClean: boolean;
  isSourceScopeComplete: boolean;
};

export const JAPAN_ZUE_REVIEW_EVIDENCE_KINDS = [
  "direct-citation",
  "unresolved-reference",
  "local-context",
] as const;
export type JapanZueReviewEvidenceKind = (typeof JAPAN_ZUE_REVIEW_EVIDENCE_KINDS)[number];

export type JapanZueReviewGroup = {
  id: string;
  chapter?: number;
  candidateIds: string[];
  referenceCandidateIds: string[];
  evidence: {
    kind: JapanZueReviewEvidenceKind;
    citationSha256?: string;
    locator?: { markdownPath: string; line: number };
    unresolvedReferenceSha256?: string;
  };
};

export type JapanZueReviewQueue = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  candidateCount: number;
  groupedCandidateCount: number;
  groupCount: number;
  directCitationGroupCount: number;
  directCitationCandidateCount: number;
  referenceCandidateCount: number;
  unresolvedReferenceGroupCount: number;
  localContextGroupCount: number;
  localContextCandidateCount: number;
  duplicateCandidateIds: string[];
  missingCandidateIds: string[];
  groups: JapanZueReviewGroup[];
  isComplete: boolean;
};

export type JapanZueMetricSuggestionReport = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  candidateCount: number;
  sourceConstrainedCandidateCount: number;
  suggestedCandidateCount: number;
  highConfidenceCandidateCount: number;
  suggestions: Array<{
    candidateId: string;
    reviewGroupId: string;
    matches: Array<{ metricKey: string; score: number; sourceCompatible: boolean }>;
  }>;
};

export type JapanZueSurveySearchDocument = {
  id: string;
  name: string;
};

export type JapanZueSourceSuggestionReport = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  directCitationGroupCount: number;
  suggestedGroupCount: number;
  suggestedCandidateCount: number;
  matchedSurveyCount: number;
  ambiguousGroupIds: string[];
  unmatchedDirectGroupIds: string[];
  missingCatalogSurveyIds: string[];
  suggestions: Array<{
    reviewGroupId: string;
    surveyIds: string[];
    candidateCount: number;
    matchedAliasSha256: string[];
    matchMethod: "exact-alias";
  }>;
  isCatalogClean: boolean;
};

export const JAPAN_ZUE_MAPPING_TIERS = [
  "metric-and-survey-review",
  "survey-only-review",
  "direct-source-review",
  "local-context-review",
] as const;
export type JapanZueMappingTier = (typeof JAPAN_ZUE_MAPPING_TIERS)[number];

export type JapanZueMappingQueue = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  candidateCount: number;
  queuedCandidateCount: number;
  reviewedCandidateCount: number;
  pendingCandidateCount: number;
  tierCounts: Record<JapanZueMappingTier, number>;
  pendingTierCounts: Record<JapanZueMappingTier, number>;
  duplicateCandidateIds: string[];
  missingCandidateIds: string[];
  entries: Array<{
    candidateId: string;
    reviewGroupId: string;
    tier: JapanZueMappingTier;
    reviewedResolution?: JapanZueResolution;
    surveyIds?: string[];
    metricKeys?: string[];
  }>;
  isComplete: boolean;
};

export const JAPAN_ZUE_CORRECTION_CLASSES = [
  "title",
  "body",
  "footnote",
  "label",
  "row-membership",
  "value",
] as const;
export type JapanZueCorrectionClass = (typeof JAPAN_ZUE_CORRECTION_CLASSES)[number];

export type JapanZueSourceCorrection = {
  id: string;
  page: number;
  targetKind: JapanZueEvidenceKind;
  itemNumber?: string;
  classification: JapanZueCorrectionClass;
  affectsQuantitativeSemantics: boolean;
  sourceUrl: string;
  checkedAt: string;
};

export type JapanZueCorrectionAudit = {
  schemaVersion: 1;
  sourceKey: typeof JAPAN_ZUE_SOURCE_KEY;
  edition: string;
  correctionCount: number;
  quantitativeCorrectionCount: number;
  impacted: Array<{ correctionId: string; candidateIds: string[] }>;
  missingQuantitativeTargets: string[];
  isClean: boolean;
};
