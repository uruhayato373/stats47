/**
 * サイトマップ生成
 *
 * Next.jsのsitemap.xmlを生成
 */

import { MetadataRoute } from "next";

import { getAllArticlesAction } from "@/features/blog/actions/getArticles";
import { listCategories } from "@/features/category/repositories/category-repository";

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

  // カテゴリページ
  const categories = await listCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/blog/${category.categoryKey}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 記事ページ
  const articles = await getAllArticlesAction();
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => {
    const year = article.year || "";
    const path = year
      ? `/blog/${article.frontmatter.category}/${article.slug}/${year}`
      : `/blog/${article.frontmatter.category}/${article.slug}`;

    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(article.frontmatter.date),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  // タグページ（ユニークなタグのみ）
  const uniqueTags = new Set<string>();
  articles.forEach((article) => {
    article.frontmatter.tags?.forEach((tag) => uniqueTags.add(tag));
  });

  const tagPages: MetadataRoute.Sitemap = Array.from(uniqueTags).map((tag) => ({
    url: `${baseUrl}/blog/tags/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...categoryPages, ...articlePages, ...tagPages];
}
