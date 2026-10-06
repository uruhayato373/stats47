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
// 県の profile.json は読み手 0 になったため生成ごと廃止 (AREA-PROFILE-JSON-RETIRE-01)。県は databook.json を使う。
export { exportCityProfileSnapshot } from "./exporters/city-profile-snapshot";
export { readCityProfileFromR2 } from "./repositories/read-city-profile-snapshot";
export { cityProfileKeyPath, type CityProfileData } from "./types/city-profile";

// 県データブック (Phase 2): template 参照指標の値+全国順位を焼き込む snapshot。
export { readAreaDatabookFromR2 } from "./repositories/read-area-databook-snapshot";
export {
  exportAreaDatabookSnapshot,
  buildAreaDatabookSnapshots,
} from "./exporters/area-databook-snapshot";
export type {
  AreaDatabookSnapshot,
  DatabookHighlightMeta,
  DatabookMetricValue,
  DatabookAgriItem,
} from "./types/databook-snapshot";
export { AREA_DATABOOK_SCHEMA_VERSION } from "./types/databook-snapshot";
export {
  assertAreaHighlightsHealthy,
  checkAreaHighlights,
} from "./highlights/check-area-highlights";
