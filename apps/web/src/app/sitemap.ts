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

import { readCategoriesFromR2 } from '@stats47/category/server';
import { CATEGORY_KEYS } from '@stats47/data-configs';
import { GEO_INDEXABLE_ROUTES } from '@stats47/data-configs/business-plan';
import {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  listJapanCatalogThemes,
} from '@stats47/data-configs/geo-scope';
import {
  readActiveKeysForSitemapFromR2,
  readSurveysFromR2,
} from '@stats47/ranking/server';
import { isOk } from '@stats47/types';

import { PHASE_1_SSG_CITIES } from '@/features/area-profile/constants/stage-1-cities';
import {
  listLatestArticles,
  listAllTagsWithCount,
} from '@/features/blog/server';
import { STOREFRONT_PRODUCTS } from '@/features/products';
import { ALL_THEMES } from '@/features/theme-dashboard/config/all-themes';
import { themeHref } from '@/features/theme-dashboard/config/theme-urls';

import { MIN_INDEXABLE_TAG_ARTICLES, UrlPolicy } from '@/lib/url-policy';

import { BLOG_SLUG_REDIRECTS } from '@/config/blog-redirects';
import {
  SITEMAP_BLOG_ENTRIES,
  SITEMAP_SURVEY_IDS,
  SITEMAP_TAG_ENTRIES,
} from '@/config/sitemap-blog-entries';
import {
  SITEMAP_SEGMENTS,
  type SitemapSegment,
} from '@/config/sitemap-segments';

import type { MetadataRoute } from 'next';

// ISR 24h: Googlebot が sitemap を取得するたびの D1 全テーブルスキャンを防ぐ
export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://stats47.jp';

const PREFECTURE_CODES = Array.from(
  { length: 47 },
  (_, i) => String(i + 1).padStart(2, '0') + '000'
);

/** Type A テーマ（都道府県単位で集計できるもの）— ports/railway/roads は除外 */
const TYPE_B_THEMES = new Set(['ports', 'railway', 'roads']);
const TYPE_A_THEME_SLUGS = ALL_THEMES.filter(
  (t) => !TYPE_B_THEMES.has(t.themeKey)
).map((t) => t.themeKey);

const GEO_PAGES: MetadataRoute.Sitemap = GEO_INDEXABLE_ROUTES.map((path) => ({
  url: BASE_URL + path,
  changeFrequency: 'monthly' as const,
  priority: 0.5,
}));

// ----------------------------------------------------------------------------
// Sitemap Index 定義
// ----------------------------------------------------------------------------

// ★定義は `@/config/sitemap-segments` が単一ソース。index (`app/sitemap.xml/route.ts`)
// も同じものを読む。以前は index 側が件数をハードコードしており、cities / japan が
// 2 か月以上 index から漏れていた (2026-08-20 実測)。
const SEGMENTS = SITEMAP_SEGMENTS;

type Segment = SitemapSegment;

export async function generateSitemaps(): Promise<{ id: number }[]> {
  return SEGMENTS.map((_, id) => ({ id }));
}

// ----------------------------------------------------------------------------
// Segment 別生成ロジック
// ----------------------------------------------------------------------------

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
  // /ranking 索引ハブ（2026-06-15 再設置。全カテゴリ＝全ランキングのブラウズ入口）
  { url: `${BASE_URL}/ranking`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/areas`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/themes`, changeFrequency: 'weekly', priority: 0.8 },
  ...GEO_PAGES,
  // /gis-cross/* (廃止 2026-05-29) → /themes に統合。各ページは middleware で 301 転送:
  //  migration-flow → /themes/population-dynamics, depopulation-medical → /themes/healthcare,
  //  sunshine-map → /themes/climate, hub → /themes。テーマ URL は THEME_PAGES に含まれる。
  // /search は robots: noindex のため sitemap に含めない (2026-06 削除)。
  { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/products`, changeFrequency: 'weekly', priority: 0.6 },
  ...STOREFRONT_PRODUCTS.map((product) => ({
    url: `${BASE_URL}/products/${product.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
  { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
];

const THEME_PAGES: MetadataRoute.Sitemap = ALL_THEMES.map((theme) => ({
  url: `${BASE_URL}${themeHref(theme.themeKey)}`,
  changeFrequency: 'weekly',
  priority: 0.8,
}));

/**
 * `/japan/*` (GEO-SCOPE-SEPARATION-01 WP4/WP5)。JAPAN_CATALOGS は git TS constant
 * (R2 非依存) なので、ranking/blog/categories/surveys/tags のような build 時 R2 不達
 * フォールバックは不要 — THEME_PAGES と同じく常に完全に埋まる。
 * priority は `/survey` (0.6/0.5) と同水準 (pilot段階の新規面のため /themes より低め)。
 */
const JAPAN_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/japan`, changeFrequency: 'weekly', priority: 0.6 },
  ...listJapanCatalogThemes().map((theme) => ({
    url: `${BASE_URL}/japan/${theme.themeSlug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
];

const MUNICIPALITY_PAGES: MetadataRoute.Sitemap = [
  {
    url: `${BASE_URL}/municipalities`,
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  ...[...KNOWN_MUNICIPALITY_THEME_SLUGS].map((slug) => ({
    url: `${BASE_URL}/municipalities/themes/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
  ...[...KNOWN_MUNICIPALITY_RANKING_KEYS].map((key) => ({
    url: `${BASE_URL}/municipalities/ranking/${key}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  })),
];

const AREA_PAGES: MetadataRoute.Sitemap = [
  ...PREFECTURE_CODES.map((code) => ({
    url: `${BASE_URL}/areas/${code}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  // /areas/[code]/[themeSlug] — Type A テーマ（都道府県単位）× 47 県
  ...PREFECTURE_CODES.flatMap((code) =>
    TYPE_A_THEME_SLUGS.map((slug) => ({
      url: `${BASE_URL}/areas/${code}/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
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
const SITEMAP_BASELINE = new Date('2026-05-25T00:00:00.000Z');

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
      const lastModified =
        rowUpdated && rowUpdated > SITEMAP_BASELINE
          ? rowUpdated
          : SITEMAP_BASELINE;
      return {
        url: `${BASE_URL}/ranking/${row.rankingKey}`,
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      };
    });
}

/**
 * ★ビルド時フォールバックが要る理由 (2026-08-06):
 * sitemap は generateSitemaps() を持つためビルド時に prerender される。ビルド環境には R2 到達手段が
 * 無く、blog / categories / surveys / tags の reader は「成功した空」(`ok([])`) を返すので、
 * 空の sitemap がそのまま焼かれていた (実測: blog 422 記事が 1 件も提出されていなかった)。
 * ranking だけが KNOWN_RANKING_KEYS という git 定数を返していたため唯一埋まっていた。
 * ここでは R2 が取れれば R2 を、空なら git 定数を使う (runtime は鮮度、build は網羅を優先)。
 * git 定数の鮮度は `generate-sitemap-blog-entries.ts --check` が守る。
 */
async function getBlogPages(): Promise<MetadataRoute.Sitemap> {
  const rows = await listLatestArticles(10000).catch(() => []);

  const redirected = new Set(Object.keys(BLOG_SLUG_REDIRECTS));
  const live = rows
    .filter((row) => row.publishedAt && !redirected.has(row.slug) && !UrlPolicy.blog.isGone(row.slug))
    .map((row) => ({
      slug: row.slug,
      lastModified: row.publishedAt as string,
    }));
  const entries =
    live.length > 0
      ? live
      : SITEMAP_BLOG_ENTRIES.filter((e) => !redirected.has(e.slug) && !UrlPolicy.blog.isGone(e.slug));

  return [
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    ...entries.map((e) => ({
      url: `${BASE_URL}/blog/${e.slug}`,
      lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}

async function getCategoryPages(): Promise<MetadataRoute.Sitemap> {
  const result = await readCategoriesFromR2();
  // ビルド時は R2 が空になるため git TS の 17 軸へフォールバックする (上の docstring 参照)
  const keys =
    isOk(result) && result.data.length > 0
      ? result.data.map((c) => c.categoryKey)
      : [...CATEGORY_KEYS];
  return keys.map((categoryKey) => ({
    url: `${BASE_URL}/category/${categoryKey}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));
}

async function getSurveyPages(): Promise<MetadataRoute.Sitemap> {
  const result = await readSurveysFromR2();
  // ビルド時は R2 が空になるため生成済み定数へフォールバックする (上の docstring 参照)。
  // git の surveys.json (master) は使わない — 配信されていない id が混ざり本番 404 になるため
  // (実測 2026-08-06: master 75 件のうち livestock-statistics / population-projection が 404)。
  const ids =
    isOk(result) && result.data.length > 0
      ? result.data.map((s) => s.id)
      : [...SITEMAP_SURVEY_IDS];
  return [
    { url: `${BASE_URL}/survey`, changeFrequency: 'weekly', priority: 0.6 },
    ...ids.map((id) => ({
      url: `${BASE_URL}/survey/${id}`,
      changeFrequency: 'monthly' as const,
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
      changeFrequency: 'monthly',
      priority: 0.5,
    });
    // index 対象 (population/economy) の city-category のみ sitemap に出力し、
    // ページ側の robots 判定 (UrlPolicy.cityCategory.isIndexableCategory) と完全一致させる。
    // 旧 14 キーのハードコードはページの index 方針と乖離していた (drift 解消)。
    for (const cat of UrlPolicy.cityCategory.indexableCategories) {
      entries.push({
        url: `${cityUrl}/${cat}`,
        lastModified: SITEMAP_BASELINE,
        changeFrequency: 'monthly',
        priority: 0.4,
      });
    }
  }
  return entries;
}

/**
 * tag の URL は **必ず percent-encode する**。tagKey は日本語なので、生のまま出すと
 * sitemap の loc (`/tag/家計調査`) とページの canonical (`/tag/%E5%AE%B6%E8%A8%88%E8%AA%BF%E6%9F%BB`)
 * が食い違う。middleware も `encodeURIComponent(jaKey)` で揃えている。
 */
function tagUrl(tagKey: string): string {
  return `${BASE_URL}/tag/${encodeURIComponent(tagKey)}`;
}

/** ビルド時 (R2 不達) 用の tag フォールバック。git 定数から組む (上の docstring 参照)。 */
function tagPagesFromGit(): MetadataRoute.Sitemap {
  return SITEMAP_TAG_ENTRIES.map((t) => ({
    url: tagUrl(t.tagKey),
    lastModified: t.lastModified ? new Date(t.lastModified) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));
}

async function getTagPages(): Promise<MetadataRoute.Sitemap> {
  let tagMeta: Awaited<ReturnType<typeof listAllTagsWithCount>>;
  try {
    tagMeta = await listAllTagsWithCount();
  } catch (error) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、ビルド失敗の真因観測のため console を使用
    console.error('[sitemap/getTagPages] listAllTagsWithCount failed', {
      error,
    });
    return tagPagesFromGit();
  }
  const eligible = tagMeta.filter((t) => t.count >= MIN_INDEXABLE_TAG_ARTICLES);
  if (eligible.length === 0) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、空 0 検出のため console を使用
    console.warn('[sitemap/getTagPages] no eligible tags', {
      minimumArticleCount: MIN_INDEXABLE_TAG_ARTICLES,
      totalTags: tagMeta.length,
    });
    return tagPagesFromGit();
  }

  let articlesAll: Awaited<ReturnType<typeof listLatestArticles>>;
  try {
    articlesAll = await listLatestArticles(10000);
  } catch (error) {
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、ビルド失敗の真因観測のため console を使用
    console.error('[sitemap/getTagPages] listLatestArticles failed', { error });
    return tagPagesFromGit();
  }
  // 各 tag の最新 publishedAt を slug→tags リレーション無しで安価に解決するため、
  // 全 article から tagKey 別の max(publishedAt) を組み立てる。
  // 全 article 取得は snapshot in-memory cache 経由なので追加 fetch は発生しない。
  const { readTagsForArticlesFromR2 } =
    await import('@/features/blog/repositories/blog-snapshot-reader');
  const slugTagMap = await readTagsForArticlesFromR2(
    articlesAll.map((a) => a.slug)
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
    url: tagUrl(row.tagKey),
    lastModified: latestByTag.get(row.tagKey)
      ? new Date(latestByTag.get(row.tagKey) as string)
      : undefined,
    changeFrequency: 'weekly' as const,
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
      case 'static':
        return STATIC_PAGES;
      case 'themes':
        return THEME_PAGES;
      case 'areas':
        return AREA_PAGES;
      case 'ranking':
        return await getRankingPages();
      case 'blog':
        return await getBlogPages();
      case 'categories':
        return await getCategoryPages();
      case 'surveys':
        return await getSurveyPages();
      case 'tags':
        return await getTagPages();
      case 'cities':
        return getCityPages();
      case 'japan':
        return JAPAN_PAGES;
      case 'municipalities':
        return MUNICIPALITY_PAGES;
    }
  } catch (error) {
    // 例外時も「空の sitemap」を焼かない。getter 内のフォールバックは
    // 「R2 が空を返した」場合しか効かないため、throw された場合はここで git 定数へ落とす
    // (空を返すと 2026-08-06 に見つけた欠陥 — 公開 422 記事が 1 件も提出されない — が別経路で再発する)。
    // eslint-disable-next-line no-console -- sitemap.ts は logger 未設定、真因観測のため console を使用
    console.error(
      '[sitemap] segment generation failed, falling back to git constants',
      {
        segment,
        error,
      }
    );
    switch (segment) {
      case 'static':
        return STATIC_PAGES;
      case 'themes':
        return THEME_PAGES;
      case 'areas':
        return AREA_PAGES;
      case 'cities':
        return getCityPages();
      case 'blog':
        return [
          { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
          ...SITEMAP_BLOG_ENTRIES.filter((e) => !UrlPolicy.blog.isGone(e.slug)).map((e) => ({
            url: `${BASE_URL}/blog/${e.slug}`,
            lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          })),
        ];
      case 'categories':
        return [...CATEGORY_KEYS].map((categoryKey) => ({
          url: `${BASE_URL}/category/${categoryKey}`,
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        }));
      case 'surveys':
        return [
          {
            url: `${BASE_URL}/survey`,
            changeFrequency: 'weekly',
            priority: 0.6,
          },
          ...SITEMAP_SURVEY_IDS.map((id2) => ({
            url: `${BASE_URL}/survey/${id2}`,
            changeFrequency: 'monthly' as const,
            priority: 0.5,
          })),
        ];
      case 'tags':
        return tagPagesFromGit();
      // ranking は reader 側が KNOWN_RANKING_KEYS を返すため、ここに来たら素直に空
      case 'ranking':
        return [];
      // japan は R2 非依存の git constant のため catch 自体に到達しないが、
      // switch を Segment union に対して網羅させるためのフォールバックとして残す。
      case 'japan':
        return JAPAN_PAGES;
      case 'municipalities':
        return MUNICIPALITY_PAGES;
    }
  }
}
