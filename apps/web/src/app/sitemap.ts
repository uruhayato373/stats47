/**
 * Phase 9 P2-C (2026-04-26): sitemap index 化
 *
 * Next.js 15 の `generateSitemaps()` API を使い 1 つの sitemap.xml を 8 segment に分割。
 * - 出力 URL: /sitemap.xml (index) + /sitemap/0.xml, /sitemap/1.xml, ...
 * - 各 segment ごとに ISR キャッシュが独立し、巨大な ranking 取得が他に波及しない
 * - GSC で各 segment を個別に submit すれば「どこが詰まっているか」が見える
 *
 * SEGMENTS の順序を変えると URL（数字 id）が変わるため、追加時は末尾に追記すること。
 */

import {
  getDrizzle,
  rankingItems,
  categories,
  articles,
  surveys,
  articleTags,
} from "@stats47/database/server";
import { eq, and, isNotNull, sql } from "drizzle-orm";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";

import { UrlPolicy } from "@/lib/url-policy";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";

import type { MetadataRoute } from "next";

// ISR 24h: Googlebot が sitemap を取得するたびの D1 全テーブルスキャンを防ぐ
export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

const PREFECTURE_CODES = Array.from(
  { length: 47 },
  (_, i) => String(i + 1).padStart(2, "0") + "000",
);

// ----------------------------------------------------------------------------
// Sitemap Index 定義
// ----------------------------------------------------------------------------

const SEGMENTS = [
  "static",
  "themes",
  "areas",
  "ranking",
  "blog",
  "categories",
  "surveys",
  "tags",
] as const;

type Segment = (typeof SEGMENTS)[number];

export async function generateSitemaps(): Promise<{ id: number }[]> {
  return SEGMENTS.map((_, id) => ({ id }));
}

// ----------------------------------------------------------------------------
// Segment 別生成ロジック
// ----------------------------------------------------------------------------

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  { url: `${BASE_URL}/ranking`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/areas`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/themes`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/search`, changeFrequency: "weekly", priority: 0.4 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
];

const THEME_PAGES: MetadataRoute.Sitemap = ALL_THEMES.map((theme) => ({
  url: `${BASE_URL}/themes/${theme.themeKey}`,
  changeFrequency: "weekly",
  priority: 0.8,
}));

const AREA_PAGES: MetadataRoute.Sitemap = [
  ...PREFECTURE_CODES.map((code) => ({
    url: `${BASE_URL}/areas/${code}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  })),
  // UrlPolicy.area.indexableCategories と middleware を完全一致（economy orphan page 解消）
  ...PREFECTURE_CODES.flatMap((code) =>
    UrlPolicy.area.indexableCategories.map((cat) => ({
      url: `${BASE_URL}/areas/${code}/${cat}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ),
];

async function getRankingPages(): Promise<MetadataRoute.Sitemap> {
  const db = getDrizzle();
  const rows = await db
    .select({ rankingKey: rankingItems.rankingKey })
    .from(rankingItems)
    .where(eq(rankingItems.isActive, true));

  // ranking_items は (ranking_key, area_type) 複合主キーのため重複排除必須
  const seen = new Set<string>();
  return rows
    .filter((row) => UrlPolicy.ranking.shouldIncludeInSitemap(row.rankingKey))
    .filter((row) => {
      if (seen.has(row.rankingKey)) return false;
      seen.add(row.rankingKey);
      return true;
    })
    .map((row) => ({
      url: `${BASE_URL}/ranking/${row.rankingKey}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
}

async function getBlogPages(): Promise<MetadataRoute.Sitemap> {
  const db = getDrizzle();
  const rows = await db
    .select({ slug: articles.slug, publishedAt: articles.publishedAt })
    .from(articles)
    .where(and(eq(articles.published, true), isNotNull(articles.publishedAt)));

  const redirected = new Set(Object.keys(BLOG_SLUG_REDIRECTS));
  return [
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...rows
      .filter((row) => !redirected.has(row.slug))
      .map((row) => ({
        url: `${BASE_URL}/blog/${row.slug}`,
        lastModified: row.publishedAt ? new Date(row.publishedAt) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}

async function getCategoryPages(): Promise<MetadataRoute.Sitemap> {
  const db = getDrizzle();
  const rows = await db
    .select({ categoryKey: categories.categoryKey })
    .from(categories);
  return rows.map((row) => ({
    url: `${BASE_URL}/category/${row.categoryKey}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}

async function getSurveyPages(): Promise<MetadataRoute.Sitemap> {
  const db = getDrizzle();
  const rows = await db.select({ id: surveys.id }).from(surveys);
  return [
    { url: `${BASE_URL}/survey`, changeFrequency: "weekly", priority: 0.6 },
    ...rows.map((row) => ({
      url: `${BASE_URL}/survey/${row.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

async function getTagPages(): Promise<MetadataRoute.Sitemap> {
  const db = getDrizzle();
  const rows = await db
    .select({
      tagKey: articleTags.tagKey,
      latestPublishedAt: sql<string | null>`max(${articles.publishedAt})`.as(
        "latestPublishedAt",
      ),
    })
    .from(articleTags)
    .innerJoin(articles, eq(articleTags.slug, articles.slug))
    .where(eq(articles.published, true))
    .groupBy(articleTags.tagKey)
    .having(sql`count(*) >= 5`);

  return rows.map((row) => ({
    url: `${BASE_URL}/tag/${row.tagKey}`,
    lastModified: row.latestPublishedAt
      ? new Date(row.latestPublishedAt)
      : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));
}

// ----------------------------------------------------------------------------
// Dispatcher
// ----------------------------------------------------------------------------

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const segment: Segment | undefined = SEGMENTS[id];
  if (!segment) {
    return [];
  }

  try {
    switch (segment) {
      case "static":
        return STATIC_PAGES;
      case "themes":
        return THEME_PAGES;
      case "areas":
        return AREA_PAGES;
      case "ranking":
        return await getRankingPages();
      case "blog":
        return await getBlogPages();
      case "categories":
        return await getCategoryPages();
      case "surveys":
        return await getSurveyPages();
      case "tags":
        return await getTagPages();
    }
  } catch {
    // ビルド時に D1 が利用できない場合は空配列で fallback（ISR で再生成）
    return [];
  }
}
