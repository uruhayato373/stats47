/**
 * Area Profile Domain Public API
 *
 * 地域プロファイルの表示機能を提供する統一インターフェース。
 *
 * @module AreaProfileDomain
 */

// 型定義のエクスポート
export type { AreaProfileData, StrengthWeaknessItem } from "./types";

// クライアントコンポーネント
export { AreaProfilePageClient } from "./components/AreaProfilePageClient";
export { AreaProfileSidebar } from "./components/AreaProfileSidebar";
export { RelatedAreas } from "./components/RelatedAreas";
export { CategoryNavGrid } from "./components/CategoryNavGrid";
export { CategorySelect } from "./components/CategorySelect";

// チャートセクション（Server Component）
export { AreaChartSection } from "./components/AreaChartSection";

// ユーティリティ
export {
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
} from "./utils/generate-structured-data";

// Map component
export { AreaSelectorMap } from "./components/AreaSelectorMap";
