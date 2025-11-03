/**
 * 構造化データ（JSON-LD）ユーティリティ
 * 
 * SEO対策のための構造化データを生成
 */

import type { Article } from "../types/article.types";

/**
 * 記事の構造化データを生成（Article）
 * 
 * @param article - 記事データ
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateArticleStructuredData(
  article: Article,
  baseUrl: string
): object {
  const time = article.time || "";
  const path = time
    ? `/blog/${article.actualCategory}/${article.slug}/${time}`
    : `/blog/${article.actualCategory}/${article.slug}`;

  const url = `${baseUrl}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.description,
    image: `${baseUrl}/og-image.jpg`, // OGP画像のURL（実装時に更新）
    author: {
      "@type": "Organization",
      name: "統計で見る都道府県",
    },
    publisher: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: article.frontmatter.tags?.join(", ") || "",
    articleSection: article.actualCategory,
  };
}

/**
 * ブログサイトの構造化データを生成（Blog）
 * 
 * @param baseUrl - ベースURL
 * @returns JSON-LD形式の構造化データ
 */
export function generateBlogStructuredData(baseUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "統計で見る都道府県 - ブログ",
    description: "日本の都道府県統計データに関する記事",
    url: `${baseUrl}/blog`,
    publisher: {
      "@type": "Organization",
      name: "統計で見る都道府県",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  };
}

