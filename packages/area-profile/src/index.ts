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
