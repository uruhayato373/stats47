/**
 * 記事詳細ページ（最新年度リダイレクト）
 * 
 * 年度が指定されていない場合、最新年度の記事にリダイレクト
 */

import { redirect } from "next/navigation";

import { getAllArticlesAction } from "@/features/blog/actions/getArticles";

export const runtime = "edge";

/**
 * ページのプロパティ
 */
interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

/**
 * 記事詳細ページ（最新年度リダイレクト）
 * 
 * 最新年度の記事にリダイレクトする
 */
export default async function ArticleSlugPage({ params }: PageProps) {
  const { category, slug } = await params;

  // 同じカテゴリ、同じスラッグの記事を取得
  const articles = await getAllArticlesAction({ category });

  // 同じスラッグの記事をフィルタ
  const sameSlugArticles = articles.filter((a) => a.slug === slug);

  if (sameSlugArticles.length === 0) {
    // 記事が見つからない場合は404
    redirect("/blog");
  }

  // 年度でソート（降順）
  sameSlugArticles.sort((a, b) => {
    const yearA = a.time ? parseInt(a.time, 10) : 0;
    const yearB = b.time ? parseInt(b.time, 10) : 0;
    return yearB - yearA;
  });

  // 最新年度の記事にリダイレクト
  const latestArticle = sameSlugArticles[0];
  const year = latestArticle.time || "";

  redirect(`/blog/${category}/${slug}/${year}`);
}

