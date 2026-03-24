// メタデータ・構造化データ生成（Web 固有ロジック）
export { buildRankingSummary } from "./build-ranking-summary";
export { generateRankingPageMetaData } from "./generate-meta-data";
// export { generateRankingPageTitle } from "./generate-page-title"; // Removed, use computeRankingTitle directly
export {
  generateRankingBreadcrumbStructuredData,
  generateRankingPageStructuredData,
  generateRankingTopPageStructuredData,
} from "./generate-structured-data";

