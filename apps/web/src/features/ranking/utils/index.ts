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
  generateRankingFAQStructuredData,
  generateRankingPageStructuredData,
} from "./generate-structured-data";

// 計算方法の選択肢 (人口・面積で割る見方と、別の指標の公表値を出す見方 series)
export { findNormalizationOption, findSeriesOption } from "./resolve-ranking-presentation";
