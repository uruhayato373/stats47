import { listArticlesFromDB } from "@/features/blog/repositories/article-db-repository";

import BlogArticlesPageClient from "./BlogArticlesPageClient";

/**
 * ブログ記事一覧管理画面（サーバーコンポーネント）
 * 
 * データベースに登録されている全ブログ記事を表示します。
 * 
 * 注意: このページは動的レンダリング（force-dynamic）のため、
 * ビルド時のプリレンダリングは行われず、ランタイム時にD1バインディングを使用します。
 */
export default async function BlogArticlesPage() {
  try {
    // データベースから全記事を取得（コンテンツは含まない）
    const articles = await listArticlesFromDB({}, "date-desc");
    return <BlogArticlesPageClient initialArticles={articles} />;
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    // エラー時は空配列を返してページを表示（エラー状態はクライアント側で表示可能）
    return <BlogArticlesPageClient initialArticles={[]} />;
  }
}

