/**
 * 記事詳細ページ（年度指定）
 *
 * 指定された年度の記事を表示するページ
 */

import { notFound } from "next/navigation";

import { Metadata } from "next";

import {
  getAllArticlesAction,
  getArticle,
} from "@/features/blog/actions/getArticles";
import { ArticleList } from "@/features/blog/components/ArticleList";
import { BlogSidebar } from "@/features/blog/components/BlogSidebar";
import { MDXContent } from "@/features/blog/components/MDXContent";
import { TagList } from "@/features/blog/components/TagList";
import { generateArticleStructuredData } from "@/features/blog/utils/structured-data";
import { calculateTagStats } from "@/features/blog/utils/tag-utils";

export const runtime = "edge";
export const dynamicParams = false;

/**
 * ページのプロパティ
 */
interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
    year: string;
  }>;
}

/**
 * 静的パラメータ生成
 *
 * ビルド時にすべての記事のパラメータを生成
 */
export async function generateStaticParams() {
  // すべての記事を取得
  const articles = await getAllArticlesAction();

  // パラメータを生成
  // 実際のディレクトリ構造に基づいてパラメータを生成
  // actualCategoryは実際のディレクトリ名（例: "prefecture-rank"）
  // frontmatter.categoryはfrontmatterに記述されたカテゴリ（例: "miningindustry"）
  // URLパスには実際のディレクトリ名を使用する必要がある
  return articles.map((article) => ({
    category: article.actualCategory,
    slug: article.slug,
    year: article.time || "",
  }));
}

/**
 * メタデータ生成
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug, year } = await params;

  try {
    const article = await getArticle(category, slug, year);

    // descriptionを取得（frontmatter.descriptionを使用）
    const description = article.frontmatter.description || "";

    return {
      title: article.frontmatter.title,
      description,
      openGraph: {
        title: article.frontmatter.title,
        description,
        type: "article",
        tags: article.frontmatter.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: article.frontmatter.title,
        description,
      },
    };
  } catch {
    return {
      title: "記事が見つかりません",
      description: "指定された記事は見つかりませんでした",
    };
  }
}

/**
 * 記事詳細ページ
 */
export default async function ArticleDetailPage({ params }: PageProps) {
  const { category, slug, year } = await params;

  try {
    // 記事を取得
    const article = await getArticle(category, slug, year);

    // 関連記事を取得（同じカテゴリ、同じスラッグの異なる年度）
    const relatedArticles = await getAllArticlesAction({
      category,
    });

    // 同じスラッグの記事のみフィルタ
    const sameSlugArticles = relatedArticles.filter(
      (a) => a.slug === slug && a.time !== year
    );

    // 構造化データを生成
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";
    const structuredData = generateArticleStructuredData(article, baseUrl);

    // タグ統計を計算（サイドバー用）
    const allArticles = await getAllArticlesAction();
    const tagStats = calculateTagStats(allArticles);

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* メインコンテンツとサイドバー */}
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* メインコンテンツ */}
          <div className="min-w-0">
            {/* ヘッダー */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                {article.frontmatter.title}
              </h1>
              {article.frontmatter.description && (
                <p className="text-xl text-muted-foreground mb-4">
                  {article.frontmatter.description}
                </p>
              )}

              {/* メタ情報 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.readingTime && (
                  <span>{article.readingTime}分で読める</span>
                )}
                {year && <span>{year}年度</span>}
              </div>

              {/* タグ */}
              {article.frontmatter.tags &&
                article.frontmatter.tags.length > 0 && (
                  <div className="mt-4">
                    <TagList tags={article.frontmatter.tags} />
                  </div>
                )}
            </header>

            {/* 記事本文 */}
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <MDXContent article={article} />
            </article>

            {/* 関連記事（異なる年度） */}
            {sameSlugArticles.length > 0 && (
              <aside className="mt-12 pt-8 border-t">
                <h2 className="text-2xl font-bold mb-4">
                  関連記事（他の年度）
                </h2>
                <ArticleList articles={sameSlugArticles.slice(0, 5)} />
              </aside>
            )}
          </div>

          {/* サイドバー */}
          <aside className="hidden lg:block">
            <BlogSidebar tagStats={tagStats} />
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    console.error("[ArticleDetailPage] 記事取得エラー:", error);
    notFound();
  }
}
