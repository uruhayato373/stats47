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
  readArticlesByTagFromR2 as listArticlesByTag,
  readAllTagsWithCountFromR2 as listAllTagsWithCount,
  readAllUniqueTagsFromR2 as listAllUniqueTags,
  readArticleTitlesBySlugsFromR2 as findArticleTitlesBySlugs,
  readLatestArticlesFromR2 as listLatestArticles,
  readArticleSummariesByTagKeyFromR2 as listArticleSummariesByTagKey,
  readTagKeysForArticleFromR2 as getTagKeysForArticle,
  readTagsForArticlesFromR2 as getTagsForArticles,
} from "./repositories/blog-snapshot-reader";

// サービス
export { articleService, ArticleService } from "./services/article-service";

// サーバーコンポーネント
export { ArticleAffiliateBanner } from "./components/article-affiliate-banner";
export { RelatedRankingsSection } from "./components/RelatedRankingsSection";
