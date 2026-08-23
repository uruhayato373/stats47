import "server-only";

/**
 * Blog Domain Server API
 *
 * サーバーコンポーネント専用のリポジトリ・サービス・コンポーネントをエクスポート。
 * クライアントセーフなコンポーネントは index.ts からインポートすること。
 *
 * @module BlogDomain/Server
 */

// リポジトリ: blog snapshot R2 reader (Phase 4 D1→R2 移行後の主経路)
// D1 版 (article-repository / article-tag-repository) は現状未使用だが、
// 緊急時のフォールバックとして残置。
export {
  readArticleBySlugFromR2 as findArticleBySlug,
  readArticlesByTagKeyFromR2 as listArticlesByTagKey,
  readAllTagsWithCountFromR2 as listAllTagsWithCount,
  readAllUniqueTagsFromR2 as listAllUniqueTags,
  readArticleTitlesBySlugsFromR2 as findArticleTitlesBySlugs,
  readLatestArticlesFromR2 as listLatestArticles,
  readArticleSummariesByTagKeyFromR2 as listArticleSummariesByTagKey,
  readArticleSummariesBySurveyIdFromR2 as listArticleSummariesBySurveyId,
  readTagKeysForArticleFromR2 as getTagKeysForArticle,
  readTagsForArticlesFromR2 as getTagsForArticles,
  readBlogSnapshotMetaFromR2,
} from "./repositories/blog-snapshot-reader";
export {
  resolveArticleSurveyTaxonomy,
  resolveArticleSurveyIds,
} from "./services/article-survey-taxonomy";

// サービス
export { articleService } from "./services/article-service";
export {
  getRelatedArticleSummaries,
  type RelatedArticleSummary,
} from "./services/related-articles";

// サーバーコンポーネント
export { RelatedRankingsSection } from "./components/RelatedRankingsSection";
