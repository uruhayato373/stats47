/**
 * サイトマップ生成
 *
 * Next.jsのsitemap.xmlを生成
 *
 * ビルド時に生成し、1時間ごとに再検証（ISR）
 */

import { MetadataRoute } from "next";

import { getAllArticlesAction } from "@/features/blog/actions/getArticles";
import { listCategories } from "@/features/category/repositories/category-repository";

// ISR（Incremental Static Regeneration）設定
// ビルド時に生成し、1時間ごとに再生成
export const revalidate = 3600; // 1時間（秒単位）

/**
 * サイトマップを生成
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // カテゴリページ（ビルド時にはD1にアクセスできない可能性があるため、エラーハンドリングを追加）
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await listCategories();
    categoryPages = categories.map((category) => ({
      url: `${baseUrl}/blog/${category.categoryKey}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    // ビルド時やD1にアクセスできない環境では、カテゴリページをスキップ
    // ランタイム時（Cloudflare Pages環境）でISRにより再生成される
    console.warn("Failed to fetch categories for sitemap:", error);
  }

  // 記事ページ
  let articlePages: MetadataRoute.Sitemap = [];
  let tagPages: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllArticlesAction();
    articlePages = articles.map((article) => {
      const time = article.time || "";
      const path = time
        ? `/blog/${article.actualCategory}/${article.slug}/${time}`
        : `/blog/${article.actualCategory}/${article.slug}`;

      // TODO: 将来的にfrontmatterにpublishedAtやupdatedAtを追加して、
      // 実際の更新日時を反映することを検討
      return {
        url: `${baseUrl}${path}`,
        changeFrequency: "monthly",
        priority: 0.6,
      };
    });

    // タグページ（ユニークなタグのみ）
    const uniqueTags = new Set<string>();
    articles.forEach((article) => {
      article.frontmatter.tags?.forEach((tag) => uniqueTags.add(tag));
    });

    tagPages = Array.from(uniqueTags).map((tag) => ({
      url: `${baseUrl}/blog/tags/${encodeURIComponent(tag)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch (error) {
    // 記事の取得に失敗した場合もスキップ
    // ランタイム時（Cloudflare Pages環境）でISRにより再生成される
    console.warn("Failed to fetch articles for sitemap:", error);
  }

  return [...staticPages, ...categoryPages, ...articlePages, ...tagPages];
}
