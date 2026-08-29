export const EVIDENCE_RESOLUTIONS = [
  "unreviewed",
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
  "context-only",
  "primary-source-unavailable",
  "rights-hold",
  "not-quantitative",
] as const;

export type EvidenceResolution = (typeof EVIDENCE_RESOLUTIONS)[number];

export const EVIDENCE_GEO_SCOPES = [
  "prefecture-set",
  "prefecture",
  "municipality-set",
  "japan",
  "world",
] as const;

export type EvidenceGeoScope = (typeof EVIDENCE_GEO_SCOPES)[number];

export const EVIDENCE_CONTENT_ROLES = [
  "ranking",
  "survey",
  "theme",
  "area",
  "blog",
  "note",
  "youtube",
  "instagram",
  "x",
] as const;

export type EvidenceContentRole = (typeof EVIDENCE_CONTENT_ROLES)[number];

export interface EvidencePrimarySource {
  organization: string;
  publicationOrDataset: string;
  datasetId?: string;
  url: string;
  termsUrl?: string;
  dataYears: string[];
  checkedAt: string;
  rights: "allowed" | "needs-review" | "blocked";
}

export interface EvidenceMapping {
  metricKeys?: string[];
  surveyIds?: string[];
  categoryKey?: string;
  themeSlugs?: string[];
  geoScopes: EvidenceGeoScope[];
  contentRoles?: EvidenceContentRole[];
}

/**
 * 公開判断に必要なデータ契約。単位・地理粒度・対象年を明示できない項目は
 * 一次資料の所管が分かっていてもコンテンツ利用へ進めない。
 */
export interface EvidenceDataContract {
  units: string[];
  geoScopes: EvidenceGeoScope[];
  dataYears: string[];
}

export interface EvidenceSourceRef {
  key: "japan-zue";
  /** Edition label is versioned data (for example 2025-26), not a schema literal. */
  edition: string;
  chapter?: number;
  page: number;
  continuationPages?: number[];
  kind: "table" | "figure" | "text-stat";
  itemNumber?: string;
}

/**
 * Public Git に置ける判断契約。書籍本文、表の数値、画像・OCR path は保持しない。
 */
export interface JapanZueEvidenceItem {
  id: string;
  source: EvidenceSourceRef;
  topicHint: string;
  sourceFingerprint: string;
  resolution: EvidenceResolution;
  resolutionReason: string;
  primarySource?: EvidencePrimarySource;
  primarySources: EvidencePrimarySource[];
  dataContract: EvidenceDataContract;
  mapping: EvidenceMapping;
  review: {
    method: "deterministic-policy" | "manual-override";
    reviewedAt: string;
    policyVersion: number;
  };
}

export interface JapanZueCandidate {
  id: string;
  source: EvidenceSourceRef;
  topicHint: string;
  sourceFingerprint: string;
  primarySourceOrganizations: string[];
  publicationHints: string[];
  dataYears: string[];
  geoScopes: EvidenceGeoScope[];
  metricCandidates: Array<{ key: string; score: number }>;
}
