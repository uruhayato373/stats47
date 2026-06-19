// ユーティリティ
export { addLineBreaksAfterPeriod } from "./add-line-breaks";
export {
  classifyRankingSubtitle,
  isCaveatNote,
} from "./classify-subtitle";

// メタデータ・構造化データ生成（Web 固有ロジック）
export { generateRankingPageMetaData } from "./generate-meta-data";
// export { generateRankingPageTitle } from "./generate-page-title"; // Removed, use computeRankingTitle directly
export {
  generateRankingBreadcrumbStructuredData,
  generateRankingFAQStructuredData,
  generateRankingPageStructuredData,
} from "./generate-structured-data";
