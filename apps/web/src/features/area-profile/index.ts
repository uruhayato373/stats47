/**
 * Area Profile Domain Public API
 *
 * 地域プロファイルの表示機能を提供する統一インターフェース。
 *
 * @module AreaProfileDomain
 */

// クライアントコンポーネント
export { AreaProfilePageClient } from './components/AreaProfilePageClient';
export { AreaProfileSidebar } from './components/AreaProfileSidebar';
export { RelatedAreas } from './components/RelatedAreas';
export { CategoryNavGrid } from './components/CategoryNavGrid';
export { CitiesNavCard } from './components/CitiesNavCard';
export { CityBreadcrumbs } from './components/CityBreadcrumbs';
export { CityPageFooter } from './components/CityPageFooter';
export { AreaRelatedRankingsCard } from './components/AreaRelatedRankingsCard';
export { AreaRelatedBlogArticles } from './components/AreaRelatedBlogArticles';

// チャートセクション（Server Component）
export { AreaChartSection } from './components/AreaChartSection';

// ユーティリティ
export {
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
} from './utils/generate-structured-data';
export { generateAreaMetadata } from './utils/generate-area-metadata';
export { getCityRouteContext } from './utils/city-route-context';

// 都道府県選択（home / category / /areas 共通）
export { PrefectureNavigator } from './components/PrefectureNavigator';
export { AreaDirectoryRegionNav } from './components/AreaDirectoryRegionNav';
export { AreaDirectoryRegionProvider } from './components/AreaDirectoryRegionContext';
