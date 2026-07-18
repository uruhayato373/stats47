/**
 * open-data-catalog — e-Stat 外の政府・自治体オープンデータの source / dataset カタログ型。
 *
 * SSOT: git TS (本ディレクトリ)。永続 DB を持たない (完全DBレス)。
 * 正典: .claude/agents/open-data-curator.md (初期実装仕様 doc 37 は 2026-07-18 消化・削除、git 履歴参照)
 * 担当 agent: open-data-curator (排他 write)
 *
 * 責務境界:
 *  - KSJ の稼働メタは packages/gis/src/mlit-ksj/datasets.ts が SSOT。ここは発見・評価層で、複製しない。
 *  - metric の SSOT は packages/data-configs/src/metrics/。existingMetricKeys は参照のみ。
 *  - 不明値を空文字で埋めない。事実と推測は VerificationStatus / "unknown" で区別する。
 */

export const OPEN_DATA_SOURCE_KINDS = [
  "government-portal",
  "government-api",
  "municipal-portal",
  "gis-portal",
  "dashboard",
] as const;
export type OpenDataSourceKind = (typeof OPEN_DATA_SOURCE_KINDS)[number];

export const ACCESS_METHODS = [
  "api",
  "bulk-download",
  "file-download",
  "tile-service",
  "web-only",
] as const;
export type AccessMethod = (typeof ACCESS_METHODS)[number];

export const DATA_FORMATS = [
  "csv",
  "xlsx",
  "json",
  "geojson",
  "shapefile",
  "gml",
  "citygml",
  "geotiff",
  "vector-tile",
  "other",
] as const;
export type DataFormat = (typeof DATA_FORMATS)[number];

export const GEOGRAPHIC_LEVELS = [
  "national",
  "prefecture",
  "municipality",
  "district",
  "mesh",
  "point",
  "line",
  "polygon",
] as const;
export type GeographicLevel = (typeof GEOGRAPHIC_LEVELS)[number];

export const VERIFICATION_STATUSES = [
  "verified",
  "partially-verified",
  "unverified",
  "unavailable",
  "deprecated",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const STATS47_USES = [
  "ranking",
  "theme",
  "map",
  "area",
  "research-only",
  "not-suitable",
] as const;
export type Stats47Use = (typeof STATS47_USES)[number];

export const GEOMETRY_TYPES = ["point", "line", "polygon", "mesh", "3d"] as const;
export type GeometryType = (typeof GEOMETRY_TYPES)[number];

export const UPDATE_FREQUENCIES = [
  "realtime",
  "daily",
  "monthly",
  "quarterly",
  "annual",
  "irregular",
  "static",
  "unknown",
] as const;
export type UpdateFrequency = (typeof UPDATE_FREQUENCIES)[number];

export const DATASET_COVERAGES = [
  "all-japan",
  "partial",
  "prefecture-specific",
] as const;
export type DatasetCoverage = (typeof DATASET_COVERAGES)[number];

export interface OpenDataSource {
  /** kebab-case の安定 ID (例 "mhlw-medical-info") */
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly kind: OpenDataSourceKind;
  readonly homepageUrl: string;
  readonly catalogUrl?: string;
  readonly apiDocsUrl?: string;
  readonly termsUrl: string;
  /** 公式 source のみ登録するため常に true */
  readonly isOfficial: true;
  readonly status: VerificationStatus;
  /** 実際に公式ページを開いて確認した日 (ISO)。確認していないのに更新しない */
  readonly lastVerifiedAt: string;
  readonly datasetIds: readonly string[];
  /** UI 継続 / API 終了のような状態差・注意事項 (例 RESAS 旧 API 2025-03-24 終了) */
  readonly notes?: string;
}

export interface OpenDatasetLicense {
  readonly name: string;
  readonly commercialUse: "allowed" | "restricted" | "unknown";
  readonly attributionRequired: boolean;
  readonly modificationNoticeRequired: boolean;
  readonly termsUrl: string;
}

export interface OpenDatasetVerification {
  readonly status: VerificationStatus;
  readonly verifiedAt: string;
  readonly verifiedFromUrls: readonly string[];
  readonly notes?: string;
}

export interface OpenDatasetDefinition {
  /** kebab-case の安定 ID (例 "mhlw-medical-info-hospitals") */
  readonly id: string;
  readonly sourceId: string;
  readonly name: string;
  readonly description: string;
  readonly landingPageUrl: string;
  readonly downloadUrl?: string;
  readonly accessMethods: readonly AccessMethod[];
  readonly formats: readonly DataFormat[];
  readonly geographicLevels: readonly GeographicLevel[];
  readonly hasGeometry: boolean;
  readonly geometryTypes?: readonly GeometryType[];
  readonly coordinateReferenceSystem?: string;
  readonly coverage: DatasetCoverage;
  readonly timeCoverage?: string;
  readonly updateFrequency: UpdateFrequency;
  readonly latestPublishedAt?: string;
  readonly license: OpenDatasetLicense;
  readonly stats47Uses: readonly Stats47Use[];
  /** CategoryKey (17 軸) のサブセットのみ許可 (validator が検証) */
  readonly suggestedCategories: readonly string[];
  /** 既存 METRICS_REGISTRY と重複する rankingKey (実在検証は validator) */
  readonly existingMetricKeys: readonly string[];
  /** 既存 KSJ GIS_DATASETS と重複する dataId (実在検証は validator) */
  readonly existingGisDataIds: readonly string[];
  /** 未採用の metric 候補概念 (取得可能性を実証したものだけ指標バックログへ渡す) */
  readonly candidateMetricConcepts: readonly string[];
  readonly verification: OpenDatasetVerification;
}
