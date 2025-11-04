/**
 * タグ別記事一覧ページ
 * 
 * 指定されたタグの記事を一覧表示するページ
 */

import { Metadata } from "next";
import { Suspense } from "react";

import { ArticleList } from "@/features/blog/components/ArticleList";
import { Pagination } from "@/features/blog/components/Pagination";
import { TagCloud } from "@/features/blog/components/TagCloud";
import { getArticles, getAllArticlesAction } from "@/features/blog/actions/getArticles";
import { calculateTagStats } from "@/features/blog/utils/tag-utils";
import type { ArticleSortOrder } from "@/features/blog/types/article.types";

export const runtime = "edge";

/**
 * ページのプロパティ
 */
interface PageProps {
  params: Promise<{
    tag: string;
  }>;
  searchParams: Promise<{
    page?: string;
    sort?: ArticleSortOrder;
  }>;
}

/**
 * メタデータ生成
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;

  // URLデコード（エンコードされたタグ名をデコード）
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `タグ: ${decodedTag}の記事一覧`,
    description: `${decodedTag}に関する記事一覧`,
  };
}

/**
 * タグ別記事一覧ページ
 */
export default async function TagBlogPage({
  params,
  searchParams,
}: PageProps) {
  const { tag } = await params;
  const searchParamsData = await searchParams;

  // URLデコード（エンコードされたタグ名をデコード）
  const decodedTag = decodeURIComponent(tag);

  // ページネーション
  const currentPage = Number(searchParamsData.page) || 1;
  const limit = 10;
  const offset = (currentPage - 1) * limit;

  // フィルタ条件
  const filter = {
    tags: [decodedTag],
    limit,
    offset,
  };

  // ソート順
  const sortOrder = searchParamsData.sort || "date-desc";

  // 記事一覧を取得
  const { articles, total, hasMore } = await getArticles(filter, sortOrder);

  // 総ページ数を計算
  const totalPages = Math.ceil(total / limit);

  // タグクラウド用の全記事を取得
  const allArticles = await getAllArticlesAction();
  const tagStats = calculateTagStats(allArticles);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          タグ: {decodedTag}の記事一覧
        </h1>
        <p className="text-muted-foreground mb-6">
          {decodedTag}に関する記事を表示しています
        </p>

        {/* タグクラウド */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">すべてのタグ</h2>
          <TagCloud tags={tagStats} />
        </div>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <ArticleList articles={articles} />
      </Suspense>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={`/blog/tags/${encodeURIComponent(decodedTag)}`}
          />
        </div>
      )}
    </div>
  );
}

