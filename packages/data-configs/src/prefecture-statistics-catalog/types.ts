export const PREFECTURE_STATISTICS_RESOURCE_TYPES = [
  "statistics-portal",
  "dashboard",
  "open-data-portal",
  "statistical-yearbook",
  "policy-dashboard",
] as const;

export type PrefectureStatisticsResourceType =
  (typeof PREFECTURE_STATISTICS_RESOURCE_TYPES)[number];

export const PREFECTURE_STATISTICS_TOPIC_KEYS = [
  "general",
  "population",
  "economy",
  "labor",
  "industry",
  "agriculture",
  "tourism",
  "healthcare",
  "welfare",
  "education",
  "environment",
  "disaster-prevention",
  "local-finance",
  "regional-revitalization",
] as const;

export type PrefectureStatisticsTopicKey =
  (typeof PREFECTURE_STATISTICS_TOPIC_KEYS)[number];

export interface PrefectureStatisticsResource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly type: PrefectureStatisticsResourceType;
  readonly topics: readonly PrefectureStatisticsTopicKey[];
  readonly publisher: string;
  readonly isOfficial: true;
  readonly discoveredFrom: string;
  readonly lastVerifiedAt: string;
  readonly notes?: string;
}

export interface PrefectureStatisticsCatalogEntry {
  /** JIS X 0401 prefecture code. */
  readonly prefectureCode: string;
  readonly prefectureName: string;
  readonly resources: readonly PrefectureStatisticsResource[];
}
