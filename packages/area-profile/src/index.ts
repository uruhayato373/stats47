/**
 * @stats47/area-profile
 *
 * 地域プロファイルの型定義とユーティリティを提供。
 */

export type {
  AreaProfileBatchProgress,
  AreaProfileData,
  AreaProfileSummary,
  BatchLog,
  StrengthWeaknessItem,
} from "./types";

export {
  buildAreaProfileRows,
  computePercentile,
  extractStrengthsAndWeaknesses,
  type AreaProfileRow,
  type AreaRankingData,
} from "./utils";

// 県・市区町村の「特徴」の唯一の選定関数 (AREA-HIGHLIGHTS-SSOT-01)。Web と SNS が共用する。
export * from "./highlights";
export type {
  AreaDatabookSnapshot,
  DatabookHighlightMeta,
  DatabookMetricValue,
} from "./types/databook-snapshot";
export { cityProfileKeyPath, type CityProfileData } from "./types/city-profile";
