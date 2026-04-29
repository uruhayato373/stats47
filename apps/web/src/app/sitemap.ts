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

import { readCategoriesFromR2 } from "@stats47/category/server";
import {
  readActiveKeysForSitemapFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import {
  listLatestArticles,
  listAllTagsWithCount,
} from "@/features/blog/server";

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
  const result = await readActiveKeysForSitemapFromR2();
  if (!isOk(result)) return [];

  // ranking_items は (ranking_key, area_type) 複合主キーのため重複排除必須
  const seen = new Set<string>();
  return result.data
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
  const rows = await listLatestArticles(10000).catch(() => []);

  const redirected = new Set(Object.keys(BLOG_SLUG_REDIRECTS));
  return [
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...rows
      .filter((row) => row.publishedAt && !redirected.has(row.slug))
      .map((row) => ({
        url: `${BASE_URL}/blog/${row.slug}`,
        lastModified: row.publishedAt ? new Date(row.publishedAt) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}

async function getCategoryPages(): Promise<MetadataRoute.Sitemap> {
  const result = await readCategoriesFromR2();
  if (!isOk(result)) return [];
  return result.data.map((c) => ({
    url: `${BASE_URL}/category/${c.categoryKey}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}

async function getSurveyPages(): Promise<MetadataRoute.Sitemap> {
  const result = await readSurveysFromR2();
  if (!isOk(result)) {
    return [{ url: `${BASE_URL}/survey`, changeFrequency: "weekly", priority: 0.6 }];
  }
  return [
    { url: `${BASE_URL}/survey`, changeFrequency: "weekly", priority: 0.6 },
    ...result.data.map((s) => ({
      url: `${BASE_URL}/survey/${s.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

async function getTagPages(): Promise<MetadataRoute.Sitemap> {
  const tagMeta = await listAllTagsWithCount().catch(() => []);
  // 旧クエリで count >= 5 を要求していたため踏襲
  const eligible = tagMeta.filter((t) => t.count >= 5);
  if (eligible.length === 0) return [];

  const articlesAll = await listLatestArticles(10000).catch(() => []);
  // 各 tag の最新 publishedAt を slug→tags リレーション無しで安価に解決するため、
  // 全 article から tagKey 別の max(publishedAt) を組み立てる。
  // 全 article 取得は snapshot in-memory cache 経由なので追加 fetch は発生しない。
  const { readBlogSnapshotMetaFromR2: _unused, readTagsForArticlesFromR2 } =
    await import("@/features/blog/repositories/blog-snapshot-reader");
  const slugTagMap = await readTagsForArticlesFromR2(
    articlesAll.map((a) => a.slug),
  );
  const latestByTag = new Map<string, string>();
  for (const article of articlesAll) {
    if (!article.published || !article.publishedAt) continue;
    const tags = slugTagMap.get(article.slug) ?? [];
    for (const t of tags) {
      const prev = latestByTag.get(t.tagKey);
      if (!prev || article.publishedAt > prev) {
        latestByTag.set(t.tagKey, article.publishedAt);
      }
    }
  }

  return eligible.map((row) => ({
    url: `${BASE_URL}/tag/${row.tagKey}`,
    lastModified: latestByTag.get(row.tagKey)
      ? new Date(latestByTag.get(row.tagKey) as string)
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
