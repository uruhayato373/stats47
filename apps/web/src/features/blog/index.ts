/**
 * Blog Domain Public API (Client-safe)
 *
 * ブログ記事の表示に必要なクライアントセーフなコンポーネントと型をエクスポート。
 * サーバー専用のリポジトリ・サービスは server.ts からインポートすること。
 *
 * @module BlogDomain
 */

// 型定義
export type { Article } from './types/article.types';

// クライアントセーフなコンポーネント
export { TagBadge } from './components/tag-badge';
export { BlogArticleGrid } from './components/blog-article-grid';
export { TagCloud } from './components/tag-cloud';
export { ArticleRenderer } from './components/article-renderer';
export { ArticleTableOfContents } from './components/ArticleTableOfContents';
export { BlogAuthorProfileCard } from './components/BlogAuthorProfileCard';

// ユーティリティ
export { generateBlogMetadata } from './utils/generate-blog-metadata';
export {
  BLOG_IN_BODY_BANNER_COUNT,
  type InlineAffiliateBanner,
} from './utils/inline-affiliate-banner';
