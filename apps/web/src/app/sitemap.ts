
import { getDrizzle, rankingItems, categories, articles, surveys, articleTags } from "@stats47/database/server";
import { eq, and, isNotNull, sql } from "drizzle-orm";

import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";

import { INDEXABLE_AREA_CATEGORIES } from "@/lib/indexable-area-categories";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";
import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { INDEXABLE_RANKING_KEYS } from "@/config/indexable-ranking-keys";


import type { MetadataRoute } from "next";

// ISR 24h キャッシュ: Googlebot の sitemap.xml 取得のたびに D1 全テーブルスキャンが走るのを防ぐ
export const revalidate = 86400;

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

// 2026-04-25: sitemap に出すサブカテゴリは population のみに絞る（クロール予算節約）。
// middleware/page.tsx は INDEXABLE_AREA_CATEGORIES_SET をそのまま使い続けるため、
// /areas/{prefCode}/economy など既存インデックス済みページは引き続き 200 を返す。
// Google は sitemap で発見しなくなるが既存インデックスは保持される設計。
const SITEMAP_AREA_CATEGORIES = INDEXABLE_AREA_CATEGORIES.filter(
  (cat) => cat === "population"
);

const AREA_CATEGORY_PAGES: MetadataRoute.Sitemap = PREFECTURE_CODES.flatMap((code) =>
  SITEMAP_AREA_CATEGORIES.map((cat) => ({
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

    // 2026-04-25: sitemap には GSC で実際に Impressions ≥ 1 が出ている ranking のみ載せる。
    // 残りの ranking は middleware で 200 を返し続けるが sitemap で発見させない。
    // 元データ生成: node .claude/scripts/gsc/build-indexable-ranking-keys.cjs
    //
    // Phase 9 (2026-04-26): ranking_items は (ranking_key, area_type) 複合主キーのため
    // 同じ ranking_key が複数 area_type で存在しうる。重複排除しないと sitemap.xml
    // に同 URL が複数回出現し、Google が soft 404 / 重複コンテンツと判定するリスク。
    const seenRankingKeys = new Set<string>();
    const rankingPages: MetadataRoute.Sitemap = rankingRows
      .filter((row) => !GONE_RANKING_KEYS.has(row.rankingKey))
      .filter((row) => INDEXABLE_RANKING_KEYS.has(row.rankingKey))
      .filter((row) => {
        if (seenRankingKeys.has(row.rankingKey)) return false;
        seenRankingKeys.add(row.rankingKey);
        return true;
      })
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

    // タグページ（公開記事が 5 本以上あるタグのみ）
    // 2026-04-25: 閾値 2 → 5 に厳格化（クロール予算節約）。
    // 1-4 本のタグは thin content と判定されやすいため sitemap から除外。
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
      .having(sql`count(*) >= 5`);

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
