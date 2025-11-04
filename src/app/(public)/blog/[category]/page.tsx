/**
 * カテゴリ別記事一覧ページ
 * 
 * 指定されたカテゴリの記事を一覧表示するページ
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArticleList } from "@/features/blog/components/ArticleList";
import { Pagination } from "@/features/blog/components/Pagination";
import { getArticles } from "@/features/blog/actions/getArticles";
import { findCategoryByName } from "@/features/category/repositories/category-repository";
import type { ArticleSortOrder } from "@/features/blog/types/article.types";

/**
 * ページのプロパティ
 */
interface PageProps {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: ArticleSortOrder;
    tag?: string;
    year?: string;
  }>;
}

/**
 * メタデータ生成
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await findCategoryByName(category);

  return {
    title: categoryData
      ? `${categoryData.categoryName}の記事一覧`
      : "記事一覧",
    description: categoryData
      ? `${categoryData.categoryName}に関する記事一覧`
      : "記事一覧",
  };
}

/**
 * カテゴリ別記事一覧ページ
 */
export default async function CategoryBlogPage({
  params,
  searchParams,
}: PageProps) {
  const { category } = await params;
  const searchParamsData = await searchParams;

  // カテゴリの存在確認
  const categoryData = await findCategoryByName(category);
  if (!categoryData) {
    notFound();
  }

  // ページネーション
  const currentPage = Number(searchParamsData.page) || 1;
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // フィルタ条件
  const filter = {
    category,
    tags: searchParamsData.tag ? [searchParamsData.tag] : undefined,
    year: searchParamsData.year,
    limit,
    offset,
  };

  // ソート順
  const sortOrder = searchParamsData.sort || "date-desc";

  // 記事一覧を取得
  const { articles, total, hasMore } = await getArticles(filter, sortOrder);

  // 総ページ数を計算
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {categoryData.categoryName}の記事一覧
        </h1>
        <p className="text-muted-foreground">
          {categoryData.categoryName}に関する記事を表示しています
        </p>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <ArticleList articles={articles} />
      </Suspense>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/blog/${category}`}
          />
        </div>
      )}
    </div>
  );
}

