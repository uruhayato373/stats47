import { listArticlesFromDB } from "@/features/blog/repositories/article-db-repository";

import BlogArticlesPageClient from "./BlogArticlesPageClient";

/**
 * ブログ記事一覧管理画面（サーバーコンポーネント）
 * 
 * データベースに登録されている全ブログ記事を表示します。
 */
export default async function BlogArticlesPage() {
  // データベースから全記事を取得（コンテンツは含まない）
  const articles = await listArticlesFromDB({}, "date-desc");

  return <BlogArticlesPageClient initialArticles={articles} />;
}

