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

// ISR 24h キャッシュ: Googlebot の sitemap.xml 取得のたびに D1 全テーブルスキャンが走るのを防ぐ
export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

const PREFECTURE_CODES = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, "0") + "000",
);

/**
 * Phase 9 (2026-04-26) lastmod 戦略:
 * - 静的ページ / 集約ページ（ranking, areas, themes, surveys 等）は lastmod 省略
 *   → bulk timestamp が「全件 100% 同一」状態を作り、Google が lastmod 信号を
 *     完全無視する事象を回避（公式推奨「不正確な lastmod を出すぐらいなら省略」）
 * - blog のみ published_at を固定使用（記事公開日として安定）
 * - tag は含有記事の最新 published_at を集計
 *
 * 参考: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */
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

// Phase 9 (2026-04-26): UrlPolicy 経由で indexable category を引く（middleware と完全一致）。
// 過去事故（2026-04-26 批判レビュー）: middleware は [population, economy] 両方を 200 で返すが
// sitemap は population のみという乖離があり /areas/{prefCode}/economy が orphan page 化していた。
const AREA_CATEGORY_PAGES: MetadataRoute.Sitemap = PREFECTURE_CODES.flatMap(
  (code) =>
    UrlPolicy.area.indexableCategories.map((cat) => ({
      url: `${BASE_URL}/areas/${code}/${cat}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = getDrizzle();

    // ランキング詳細ページ
    // Phase 9: lastmod は省略。ranking_items.updated_at は bulk update で同一 timestamp が
    // 大量発生するため、Google が信号として使えない。「無いほうが良い」という公式推奨に従う。
    const rankingRows = await db
      .select({ rankingKey: rankingItems.rankingKey })
      .from(rankingItems)
      .where(eq(rankingItems.isActive, true));

    // ranking_items は (ranking_key, area_type) 複合主キーのため重複排除必須
    const seenRankingKeys = new Set<string>();
    const rankingPages: MetadataRoute.Sitemap = rankingRows
      .filter((row) => UrlPolicy.ranking.shouldIncludeInSitemap(row.rankingKey))
      .filter((row) => {
        if (seenRankingKeys.has(row.rankingKey)) return false;
        seenRankingKeys.add(row.rankingKey);
        return true;
      })
      .map((row) => ({
        url: `${BASE_URL}/ranking/${row.rankingKey}`,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      }));

    // カテゴリページ — lastmod 省略（集約ページのため updated_at の信頼性低い）
    const categoryRows = await db
      .select({ categoryKey: categories.categoryKey })
      .from(categories);

    const categoryPages: MetadataRoute.Sitemap = categoryRows.map((row) => ({
      url: `${BASE_URL}/category/${row.categoryKey}`,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    // /compare/* は noindex, follow 戦略。sitemap には含めない。

    // ブログ記事 — published_at を固定使用（updated_at は安易な編集で動くため信頼性低い）
    const articleRows = await db
      .select({
        slug: articles.slug,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(and(eq(articles.published, true), isNotNull(articles.publishedAt)));

    const redirectedSlugs = new Set(Object.keys(BLOG_SLUG_REDIRECTS));
    const blogPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
      ...articleRows
        .filter((row) => !redirectedSlugs.has(row.slug))
        .map((row) => ({
          url: `${BASE_URL}/blog/${row.slug}`,
          lastModified: row.publishedAt ? new Date(row.publishedAt) : undefined,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        })),
    ];

    // 調査ページ — lastmod 省略
    const surveyRows = await db.select({ id: surveys.id }).from(surveys);

    const surveyPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/survey`, changeFrequency: "weekly", priority: 0.6 },
      ...surveyRows.map((row) => ({
        url: `${BASE_URL}/survey/${row.id}`,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];

    // タグページ（公開記事が 5 本以上あるタグのみ）
    // lastmod は含有記事の最新 published_at（aggregate page として正しい挙動）
    const tagRows = await db
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

    const tagPages: MetadataRoute.Sitemap = tagRows.map((row) => ({
      url: `${BASE_URL}/tag/${row.tagKey}`,
      lastModified: row.latestPublishedAt
        ? new Date(row.latestPublishedAt)
        : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    return [
      ...STATIC_PAGES,
      ...THEME_PAGES,
      ...AREA_PAGES,
      ...AREA_CATEGORY_PAGES,
      ...rankingPages,
      ...categoryPages,
      ...blogPages,
      ...surveyPages,
      ...tagPages,
    ];
  } catch {
    // ビルド時に D1 が利用できない場合は静的ページのみ返し、ISR で再生成する
    return [
      ...STATIC_PAGES,
      ...THEME_PAGES,
      ...AREA_PAGES,
      ...AREA_CATEGORY_PAGES,
    ];
  }
}
