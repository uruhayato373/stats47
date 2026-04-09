import "server-only";

/**
 * Blog Domain Server API
 *
 * サーバーコンポーネント専用のリポジトリ・サービス・コンポーネントをエクスポート。
 * クライアントセーフなコンポーネントは index.ts からインポートすること。
 *
 * @module BlogDomain/Server
 */

// リポジトリ: article-repository
export {
  findArticleBySlug,
  listArticlesByTagKey,
  listArticlesByTag,
  listAllTagsWithCount,
  listAllUniqueTags,
  findArticleTitlesBySlugs,
  listLatestArticles,
} from "./repositories/article-repository";

// リポジトリ: article-tag-repository
// listArticlesByTagKey は article-repository にも存在するため、
// article-tag-repository 版（サマリー返却）は別名でエクスポート
export {
  listArticlesByTagKey as listArticleSummariesByTagKey,
  getTagKeysForArticle,
  getTagsForArticles,
} from "./repositories/article-tag-repository";

// サービス
export { articleService, ArticleService } from "./services/article-service";

// サーバーコンポーネント
export { ArticleAffiliateBanner } from "./components/article-affiliate-banner";
export { RelatedRankingsSection } from "./components/RelatedRankingsSection";
