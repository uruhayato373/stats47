import type { RankingItem } from "./ranking-item";
import type { RankingValue } from "./ranking-value";

/**
 * データ出所 (survey 等)。完全DBレス Phase F で D1 `sources` schema 型から relocate。
 * surveys snapshot (app/survey/all.json) の各要素。
 */
export interface Source {
  id: string;
  sourceKind: string;
  externalId: string | null;
  parentSourceId: string | null;
  name: string;
  organization: string | null;
  url: string | null;
  description: string | null;
  attributionText: string | null;
  license: string | null;
  licenseUrl: string | null;
  baseUrl: string | null;
  linkTemplate: string | null;
  displayOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const RANKING_ITEMS_SNAPSHOT_KEY = "app/ranking-items/all.json";
export const SURVEYS_SNAPSHOT_KEY = "app/survey/all.json";

export function homeFeaturedKeyPath(): string {
  return "app/home/featured.json";
}
export function categoryItemsKeyPath(categoryKey: string): string {
  return `app/category/${encodeURIComponent(categoryKey)}/items.json`;
}
export function rankingItemKeyPath(rankingKey: string): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/item.json`;
}
export function surveyItemsKeyPath(surveyId: string): string {
  return `app/survey/${encodeURIComponent(surveyId)}/items.json`;
}

export interface RankingItemsSnapshot {
  generatedAt: string;
  count: number;
  items: RankingItem[];
}

export interface SurveysSnapshot {
  generatedAt: string;
  count: number;
  surveys: Source[];
}

/**
 * ranking_values の key-level snapshot (1 file = 1 ranking_key × area_type、全年度を含む)。
 *
 * key: ranking-values/<rankingKey>/<areaType>.json
 * - prefecture: ~185KB (47行 × ~14年)
 * ファイル数: 2,151 (キー数のみ、旧 30K 比 93% 削減)
 */
export interface RankingValuesKeySnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  partitions: Array<{
    yearCode: string;
    count: number;
    values: RankingValue[];
  }>;
}

export function rankingValuesKeyPath(
  rankingKey: string,
  _areaType?: string,
): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/values.json`;
}

/**
 * 正規化済みランキング値スナップショットの R2 キーパスを返す。
 *
 * normType: "per_population" → `app/ranking/{key}/values-per-population.json`
 * normType: "per_area"       → `app/ranking/{key}/values-per-area.json`
 */
export function rankingNormalizedValuesKeyPath(
  rankingKey: string,
  normType: string,
): string {
  const suffix = normType.replace(/_/g, "-");
  return `app/ranking/${encodeURIComponent(rankingKey)}/values-${suffix}.json`;
}

/**
 * 事前生成済みダウンロードファイルの R2 キーパスを返す。
 *
 * basis = "original" or 正規化タイプ ("per_population" 等) or "all-bases"
 * format = "csv" or "json"
 * encoding = "utf8" (BOM 付き) or "sjis" (Shift_JIS、CSV 専用)
 *
 * 例: `app/ranking/{key}/downloads/values.csv` (basis=original, format=csv, encoding=utf8)
 *     `app/ranking/{key}/downloads/values-per-population.json`
 *     `app/ranking/{key}/downloads/values-all-bases.csv`
 *     `app/ranking/{key}/downloads/values.sjis.csv`
 */
export function rankingDownloadKeyPath(
  rankingKey: string,
  basis: string,
  format: "csv" | "json",
  encoding: "utf8" | "sjis" = "utf8",
): string {
  const basisSuffix = basis === "original" ? "" : `-${basis.replace(/_/g, "-")}`;
  const encodingSuffix = encoding === "sjis" ? ".sjis" : "";
  return `app/ranking/${encodeURIComponent(rankingKey)}/downloads/values${basisSuffix}${encodingSuffix}.${format}`;
}

/** @deprecated rankingValuesKeyPath を使用してください */
export interface RankingValuesPartitionSnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  yearCode: string;
  count: number;
  values: RankingValue[];
}

/** @deprecated rankingValuesKeyPath を使用してください */
export function rankingValuesPartitionPath(
  rankingKey: string,
  areaType: string,
  yearCode: string,
): string {
  return `ranking-values/${encodeURIComponent(rankingKey)}/${encodeURIComponent(areaType)}/${encodeURIComponent(yearCode)}.json`;
}
