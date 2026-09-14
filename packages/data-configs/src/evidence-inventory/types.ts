export const EVIDENCE_RESOLUTIONS = [
  "unreviewed",
  "reuse-existing-metric",
  "new-metric",
  "combined-analysis",
  "context-only",
  "primary-source-unavailable",
  "rights-hold",
  "not-quantitative",
  "not-applicable",
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
  "japan",
  "blog",
  "note",
  "youtube",
  "instagram",
  "x",
  "agent",
  "skill",
  "internal-documentation",
] as const;

export type EvidenceContentRole = (typeof EVIDENCE_CONTENT_ROLES)[number];

export type EvidenceSourceKey =
  | "japan-zue"
  | "prefecture-databook"
  | "prefecture-deviation"
  | "claude-skills-guide"
  | "kakei-marketing";

export interface ReferenceSourcePolicy {
  sourceKey: EvidenceSourceKey;
  edition: string;
  statePath: string;
  inputUnit: "quantitative-item" | "page";
  fallbackResolution: EvidenceResolution;
  fallbackReason: string;
  publicOriginalReuse: "forbidden";
}

export interface InternalEvidenceAdoption {
  id: string;
  sourceKey: "claude-skills-guide";
  edition: "2026";
  pages: number[];
  concept: string;
  verifiedAgainst: string;
  mappedFiles: string[];
}

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

/**
 * 『マーケティングに使える「家計調査」』(吉本佳生・講談社 2015) の分析・論点単位の authored SSOT。
 * 書籍の文章・図表・数値は保持せず、問い・ページ範囲・stats47 側の lineage だけを持つ。
 */
export interface KakeiMarketingAnalysis {
  id: string;
  /** 書籍の章 (0 = はじめに, 1-5 = 第1部各章, 6 = 第2部, 7 = おわりに) */
  chapter: number;
  /** 書籍の主張をそのまま写さず、stats47 として検証する独立した問い */
  question: string;
  /** 論点の要約 (独自表現) */
  thesis: string;
  /** PDF ページ範囲 (両端含む) */
  pages: [number, number];
  resolution: EvidenceResolution;
  resolutionReason: string;
  metricKeys: string[];
  surveyIds: string[];
  themeSlugs?: string[];
  /** 第2部の県庁所在市プロファイルだけが持つ都道府県コード (5桁) */
  areaCodes?: string[];
  geoScopes: EvidenceGeoScope[];
  contentRoles: EvidenceContentRole[];
  primarySources: EvidencePrimarySource[];
  /** 既に stats47 に同趣旨のコンテンツがある場合の slug / key */
  existing?: { blogSlugs?: string[]; themeSlugs?: string[] };
  /** 次に作る制作単位 */
  nextAction: string;
}

export const KAKEI_EXPENSE_EVIDENCE_DIRECTIONS = ["same", "inverse"] as const;

export type KakeiExpenseEvidenceDirection =
  (typeof KAKEI_EXPENSE_EVIDENCE_DIRECTIONS)[number];

/**
 * note 家計シリーズ (a-kakei-<pref>) の十大費目 1 つを裏付ける根拠指標 1 件。
 * direction: "same" = 指標が高いほど費目割合も高い想定 / "inverse" = 逆相関の想定。
 */
export interface KakeiExpenseEvidenceRef {
  metricKey: string;
  direction: KakeiExpenseEvidenceDirection;
  /** 番号が小さいほど優先。evidence-data 生成は R2 データが実在する上位 2 件を採用する */
  priority: number;
  rationale: string;
}

/** 十大費目 1 つ (chart-data.json の categoryBreakdown catName と一致) の SSOT エントリ */
export interface KakeiExpenseEvidenceEntry {
  catName: string;
  /** 47都道府県庁所在市の対全国平均比率ランキングの key (*-expenditure-ratio-multi-person-households) */
  shareMetricKey: string;
  evidence: readonly KakeiExpenseEvidenceRef[];
}

/** effectiveRank から verdict (strong/weak/contrary) を決める閾値 */
export interface KakeiExpenseEvidenceThresholds {
  strong: number;
  weak: number;
}

/**
 * `expense-evidence.json` の型契約。十大費目 → 根拠指標の対応表 (authored SSOT)。
 */
export interface KakeiExpenseEvidenceInventory {
  version: string;
  thresholds: KakeiExpenseEvidenceThresholds;
  entries: readonly KakeiExpenseEvidenceEntry[];
}
