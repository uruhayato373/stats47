
import { getDrizzle, rankingItems, categories, articles, surveys, articleTags } from "@stats47/database/server";
import { eq, and, isNotNull, sql } from "drizzle-orm";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";

import { INDEXABLE_AREA_CATEGORIES } from "@/lib/indexable-area-categories";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";
import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";


import type { MetadataRoute } from "next";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

const PREFECTURE_CODES = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, "0") + "000"
);

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  { url: `${BASE_URL}/ranking`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/areas`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/themes`, changeFrequency: "weekly", priority: 0.8 },
  // /compare は除外: インタラクティブツールで searchParams 膨張。/compare/* は noindex, follow 戦略
  // correlation は除外: インタラクティブツールで検索流入なし（71表示/0クリック）、25秒の応答時間で5xx原因
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

const AREA_PAGES: MetadataRoute.Sitemap = PREFECTURE_CODES.map((code) => ({
  url: `${BASE_URL}/areas/${code}`,
  changeFrequency: "weekly",
  priority: 0.8,
}));

const AREA_CATEGORY_PAGES: MetadataRoute.Sitemap = PREFECTURE_CODES.flatMap((code) =>
  INDEXABLE_AREA_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/areas/${code}/${cat}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = getDrizzle();

    // ランキング詳細ページ
    const rankingRows = await db
      .select({
        rankingKey: rankingItems.rankingKey,
        updatedAt: rankingItems.updatedAt,
      })
      .from(rankingItems)
      .where(eq(rankingItems.isActive, true));

    const rankingPages: MetadataRoute.Sitemap = rankingRows
      .filter((row) => !GONE_RANKING_KEYS.has(row.rankingKey))
      .map((row) => ({
        url: `${BASE_URL}/ranking/${row.rankingKey}`,
        lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
        changeFrequency: "monthly",
        priority: 0.9,
      }));

    // カテゴリページ
    const categoryRows = await db
      .select({
        categoryKey: categories.categoryKey,
        updatedAt: categories.updatedAt,
      })
      .from(categories);

    const categoryPages: MetadataRoute.Sitemap = categoryRows.map((row) => ({
      url: `${BASE_URL}/category/${row.categoryKey}`,
      lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    // /compare/* は noindex, follow 戦略。sitemap には含めない。

    // ブログ記事
    const articleRows = await db
      .select({
        slug: articles.slug,
        publishedAt: articles.publishedAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(and(eq(articles.published, true), isNotNull(articles.publishedAt)));

    const redirectedSlugs = new Set(Object.keys(BLOG_SLUG_REDIRECTS));
    const blogPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
      ...articleRows.filter((row) => !redirectedSlugs.has(row.slug)).map((row) => ({
        url: `${BASE_URL}/blog/${row.slug}`,
        lastModified: row.updatedAt
          ? new Date(row.updatedAt)
          : row.publishedAt
            ? new Date(row.publishedAt)
            : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];

    // 調査ページ
    const surveyRows = await db
      .select({ id: surveys.id, updatedAt: surveys.updatedAt })
      .from(surveys);

    const surveyPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/survey`, changeFrequency: "weekly", priority: 0.6 },
      ...surveyRows.map((row) => ({
        url: `${BASE_URL}/survey/${row.id}`,
        lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];

    // タグページ（公開記事が 2 本以上あるタグのみ）
    // 1 本しかないタグは thin content と判定されやすいため sitemap から除外。
    // page.tsx 側でも generateMetadata で noindex, follow を返す。
    const tagRows = await db
      .select({
        tagKey: articleTags.tagKey,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(articleTags)
      .innerJoin(articles, eq(articleTags.slug, articles.slug))
      .where(eq(articles.published, true))
      .groupBy(articleTags.tagKey)
      .having(sql`count(*) >= 2`);

    const tagPages: MetadataRoute.Sitemap = tagRows.map((row) => ({
      url: `${BASE_URL}/tag/${row.tagKey}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    return [...STATIC_PAGES, ...THEME_PAGES, ...AREA_PAGES, ...AREA_CATEGORY_PAGES, ...rankingPages, ...categoryPages, ...blogPages, ...surveyPages, ...tagPages];
  } catch {
    // ビルド時に D1 が利用できない場合は静的ページのみ返し、ISR で再生成する
    return [...STATIC_PAGES, ...THEME_PAGES, ...AREA_PAGES, ...AREA_CATEGORY_PAGES];
  }
}
