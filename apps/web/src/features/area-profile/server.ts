import "server-only";

/**
 * Area Profile Domain Server API
 *
 * サーバーサイドでのみ使用可能なアクション・コンポーネント。
 *
 * @module AreaProfileDomain/Server
 */

// 県の「特徴」は databook.json + selectAreaHighlights (@stats47/area-profile) から作る。
// 県の profile.json は Web から読まない (AREA-HIGHLIGHTS-SSOT-01。生成は廃止判断まで継続)。

// サーバーコンポーネント
export { AreaDashboardSection } from "./components/AreaDashboardSection";
export { readCityProfile } from "./services/read-city-profile";
