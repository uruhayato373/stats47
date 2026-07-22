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

import { PHASE_1_SSG_CITIES } from "@/features/area-profile/constants/stage-1-cities";
import {
  listLatestArticles,
  listAllTagsWithCount,
} from "@/features/blog/server";
import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import { themeHref } from "@/features/theme-dashboard/config/theme-urls";

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

/** Type A テーマ（都道府県単位で集計できるもの）— ports/railway/roads/local-finance-city は除外 */
const TYPE_B_THEMES = new Set(["ports", "railway", "roads", "local-finance-city"]);
const TYPE_A_THEME_SLUGS = ALL_THEMES
  .filter((t) => !TYPE_B_THEMES.has(t.themeKey))
  .map((t) => t.themeKey);

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
  "cities",
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
  // /ranking 索引ハブ（2026-06-15 再設置。全カテゴリ＝全ランキングのブラウズ入口）
  { url: `${BASE_URL}/ranking`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/areas`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/themes`, changeFrequency: "weekly", priority: 0.8 },
  // /gis-cross/* (廃止 2026-05-29) → /themes に統合。各ページは middleware で 301 転送:
  //  migration-flow → /themes/population-dynamics, depopulation-medical → /themes/healthcare,
  //  sunshine-map → /themes/climate, hub → /themes。テーマ URL は THEME_PAGES に含まれる。
  // /search は robots: noindex のため sitemap に含めない (2026-06 削除)。
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
];

const THEME_PAGES: MetadataRoute.Sitemap = ALL_THEMES.map((theme) => ({
  // local-finance-city は正典 /themes/local-finance/cities (themeHref)。
  // 動的ルート由来の重複 URL /themes/local-finance-city を sitemap に出さない。
  url: `${BASE_URL}${themeHref(theme.themeKey)}`,
  changeFrequency: "weekly",
  priority: 0.8,
}));

const AREA_PAGES: MetadataRoute.Sitemap = [
  ...PREFECTURE_CODES.map((code) => ({
    url: `${BASE_URL}/areas/${code}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  })),
  // /areas/[code]/[themeSlug] — Type A テーマ（都道府県単位）× 47 県
  ...PREFECTURE_CODES.flatMap((code) =>
    TYPE_A_THEME_SLUGS.map((slug) => ({
      url: `${BASE_URL}/areas/${code}/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ),
];

/**
 * deploy 日を全 ranking ページの lastmod として使う。
 * D-redesign deploy (2026-05-23) で全 ranking 詳細の本文構造が変わったため、
 * row.updatedAt (DB の updatedAt、データ更新時のみ進む) よりも実コンテンツ
 * 更新を反映できる SITEMAP_BASELINE を採用する。
 * 大幅な UI / 構造変更があったらこの定数を更新する。
 *
 * 2026-05-25 更新: cities pages (25,785 URL) の Google indexed 率が 0% (50 件
 * サンプル URL Inspection 結果: 50% が 4-5月の古い「Blocked by robots.txt」
 * キャッシュ、48% が「Unknown to Google」)。SITEMAP_BASELINE を進めて
 * 「全 cities 変更あり」シグナルを Google に送り、再クロールを促進する。
 */
const SITEMAP_BASELINE = new Date("2026-05-25T00:00:00.000Z");

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
    .map((row) => {
      // row.updatedAt と SITEMAP_BASELINE のうち新しい方を採用
      const rowUpdated = row.updatedAt ? new Date(row.updatedAt) : null;
      const lastModified = rowUpdated && rowUpdated > SITEMAP_BASELINE ? rowUpdated : SITEMAP_BASELINE;
      return {
        url: `${BASE_URL}/ranking/${row.rankingKey}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      };
    });
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

function getCityPages(): MetadataRoute.Sitemap {
  // 2026-05-31 改訂: sitemap は実コンテンツ (profile.json) + SSG を持つ PHASE_1_SSG_CITIES
  // (≈360 市) のみ出力する。
  //
  // 旧実装は level="2" の全 1,719 市を出力していたが、実コンテンツがあるのは
  // PHASE_1_SSG_CITIES のみで、残り ~1,360 市は薄いプレースホルダーが Google にクロール
  // され「クロール済み - インデックス未登録」が大量発生していた (city indexed 率 ≈0.6%)。
  // sitemap とコンテンツ実体を一致させ、薄いページの提出を止めてクロール予算を温存する。
  // 既に index されている少数ページは noindex 化していないため deindex は起きない (提出を止めるだけ)。
  // Stage 2/3 拡張時は PHASE_1_SSG_CITIES に追記する (stage-1-cities.ts)。
  //
  // lastmod は SITEMAP_BASELINE (city profile 復活 deploy 日) を採用し、
  // Googlebot に「city pages に更新あり、再クロール推奨」を伝える。
  const entries: MetadataRoute.Sitemap = [];
  for (const { areaCode, cityCode } of PHASE_1_SSG_CITIES) {
    const cityUrl = `${BASE_URL}/areas/${areaCode}/cities/${cityCode}`;
    entries.push({
      url: cityUrl,
      lastModified: SITEMAP_BASELINE,
      changeFrequency: "monthly",
      priority: 0.5,
    });
    // index 対象 (population/economy) の city-category のみ sitemap に出力し、
    // ページ側の robots 判定 (UrlPolicy.cityCategory.isIndexableCategory) と完全一致させる。
    // 旧 14 キーのハードコードはページの index 方針と乖離していた (drift 解消)。
    for (const cat of UrlPolicy.cityCategory.indexableCategories) {
      entries.push({
        url: `${cityUrl}/${cat}`,
        lastModified: SITEMAP_BASELINE,
        changeFrequency: "monthly",
        priority: 0.4,
      });
    }
  }
  return entries;
}

async function getTagPages(): Promise<MetadataRoute.Sitemap> {
  let tagMeta: Awaited<ReturnType<typeof listAllTagsWithCount>>;
  try {
    tagMeta = await listAllTagsWithCount();
  } catch (error) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、ビルド失敗の真因観測のため console を使用
    console.error("[sitemap/getTagPages] listAllTagsWithCount failed", { error });
    return [];
  }
  // 旧クエリで count >= 5 を要求していたため踏襲
  const eligible = tagMeta.filter((t) => t.count >= 5);
  if (eligible.length === 0) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、空 0 検出のため console を使用
    console.warn("[sitemap/getTagPages] no eligible tags (count>=5)", { totalTags: tagMeta.length });
    return [];
  }

  let articlesAll: Awaited<ReturnType<typeof listLatestArticles>>;
  try {
    articlesAll = await listLatestArticles(10000);
  } catch (error) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、ビルド失敗の真因観測のため console を使用
    console.error("[sitemap/getTagPages] listLatestArticles failed", { error });
    return [];
  }
  // 各 tag の最新 publishedAt を slug→tags リレーション無しで安価に解決するため、
  // 全 article から tagKey 別の max(publishedAt) を組み立てる。
  // 全 article 取得は snapshot in-memory cache 経由なので追加 fetch は発生しない。
  const { readTagsForArticlesFromR2 } =
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
      case "cities":
        return getCityPages();
    }
  } catch {
    // ビルド時に D1 が利用できない場合は空配列で fallback（ISR で再生成）
    return [];
  }
}
