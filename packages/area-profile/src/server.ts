import "server-only";

/**
 * @stats47/area-profile/server
 *
 * サーバーサイド専用: リポジトリ、バッチサービスを提供。
 */

export type {
  AreaProfileBatchProgress,
  AreaProfileData,
  AreaProfileSummary,
  BatchLog,
  StrengthWeaknessItem,
} from "./types";

export { extractStrengthsAndWeaknesses } from "./utils";

// 完全DBレス (Phase F): D1 area_profiles の repository / run-batch service は削除済。
// runtime は R2 profile.json (readAreaProfileFromR2) のみ、生成は exportAreaProfileSnapshot (R2直接計算)。
export { readAreaProfileFromR2 } from "./repositories/read-area-profile-snapshot";
export { exportAreaProfileSnapshot } from "./exporters/area-profile-snapshot";
export { exportCityProfileSnapshot } from "./exporters/city-profile-snapshot";

// 県データブック (Phase 2): template 参照指標の値+全国順位を焼き込む snapshot。
export { readAreaDatabookFromR2 } from "./repositories/read-area-databook-snapshot";
export {
  exportAreaDatabookSnapshot,
  buildAreaDatabookSnapshots,
} from "./exporters/area-databook-snapshot";
export type {
  AreaDatabookSnapshot,
  DatabookMetricValue,
  DatabookAgriItem,
} from "./types/databook-snapshot";
