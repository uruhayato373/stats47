/**
 * RSS Feed生成
 * 
 * RSS 2.0形式のフィードを生成
 */

import { NextResponse } from "next/server";

import { getAllArticlesAction } from "@/features/blog/actions/getArticles";

/**
 * RSS Feedを生成
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.example.com";
  const articles = await getAllArticlesAction();

  // 最新10件の記事を取得（時間降順）
  const latestArticles = articles
    .sort((a, b) => {
      const timeA = a.time ? parseInt(a.time, 10) : 0;
      const timeB = b.time ? parseInt(b.time, 10) : 0;
      return timeB - timeA;
    })
    .slice(0, 10);

  // RSS XMLを生成
  const rssItems = latestArticles.map((article) => {
    const time = article.time || "";
    const path = time
      ? `/blog/${article.actualCategory}/${article.slug}/${time}`
      : `/blog/${article.actualCategory}/${article.slug}`;

    const url = `${baseUrl}${path}`;
    // descriptionを取得（frontmatter.descriptionを使用）
    const description = article.frontmatter.description || "";
    // dateが削除されたため、現在時刻を使用
    const pubDate = new Date().toUTCString();

    // タグをカンマ区切りで結合
    const categories = article.frontmatter.tags
      ?.map((tag) => `<category>${escapeXml(tag)}</category>`)
      .join("\n        ") || "";

    return `    <item>
      <title>${escapeXml(article.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      ${categories ? `      ${categories}` : ""}
    </item>`;
  });

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>統計で見る都道府県 - ブログ</title>
    <link>${baseUrl}/blog</link>
    <description>日本の都道府県統計データに関する記事</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${rssItems.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/**
 * XMLエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

