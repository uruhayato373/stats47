/**
 * ブログ記事一覧ページ
 *
 * すべての記事を一覧表示するページ
 */

import { Suspense } from "react";

import { Metadata } from "next";

import {
  getAllArticlesAction,
  getArticles,
} from "@/features/blog/actions/getArticles";
import { ArticleList } from "@/features/blog/components/ArticleList";
import { BlogSidebar } from "@/features/blog/components/BlogSidebar";
import { Pagination } from "@/features/blog/components/Pagination";
import type { ArticleSortOrder } from "@/features/blog/types/article.types";
import { generateBlogStructuredData } from "@/features/blog/utils/structured-data";
import { calculateTagStats } from "@/features/blog/utils/tag-utils";

/**
 * ページのプロパティ
 */
interface PageProps {
  searchParams: Promise<{
    page?: string;
    sort?: ArticleSortOrder;
    category?: string;
    tag?: string;
    year?: string;
  }>;
}

/**
 * メタデータ生成
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "記事一覧",
    description: "統計データに関する記事一覧",
  };
}

/**
 * ブログ記事一覧ページ
 */
export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // ページネーション
  const currentPage = Number(params.page) || 1;
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // フィルタ条件
  const filter = {
    category: params.category,
    tags: params.tag ? [params.tag] : undefined,
    year: params.year,
    limit,
    offset,
  };

  // ソート順
  const sortOrder = params.sort || "date-desc";

  // 記事一覧を取得
  const { articles, total } = await getArticles(filter, sortOrder);

  // 総ページ数を計算
  const totalPages = Math.ceil(total / limit);

  // タグクラウド用の全記事を取得
  const allArticles = await getAllArticlesAction();
  const tagStats = calculateTagStats(allArticles);

  // 構造化データを生成
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";
  const structuredData = generateBlogStructuredData(baseUrl);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">記事一覧</h1>
        <p className="text-muted-foreground">
          統計データに関する記事を公開しています
        </p>
      </div>

      {/* メインコンテンツとサイドバー */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* メインコンテンツ */}
        <div className="min-w-0">
          <Suspense fallback={<div>読み込み中...</div>}>
            <ArticleList articles={articles} />
          </Suspense>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/blog"
              />
            </div>
          )}
        </div>

        {/* サイドバー */}
        <aside className="hidden lg:block">
          <BlogSidebar tagStats={tagStats} />
        </aside>
      </div>
    </div>
  );
}
