/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  readRankingValuesFromR2,
  readTopRankingValuesBatchFromR2,
  readRankingItemsByCategoryFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import { resolveAffiliateBanners } from "@/features/ads/server";
import { listLatestArticles } from "@/features/blog/server";
import { findCategoryByKey } from "@/features/category/server";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  SurveyCard,
  type CategoryRankingListItem,
} from "@/features/ranking";
import {
  NativeAffiliateRow,
  SectionEyebrow,
  InfeedAd,
} from "@/features/redesign";

import { AdSenseAd, RANKING_PAGE_FOOTER, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** カテゴリ Key → アフィリエイト用 fallback タグ */
const CATEGORY_FALLBACK_TAGS: Record<string, string[]> = {
  population: ["population", "household-structure"],
  economy: ["economy", "household-finance", "income"],
  laborwage: ["wages", "labor", "employment"],
  socialsecurity: ["medical-care", "health", "welfare"],
  energy: ["energy", "environment"],
  tourism: ["tourism", "transportation"],
  construction: ["housing", "real-estate"],
  administrativefinancial: ["public-finance", "furusato-nozei"],
  landweather: ["land-use", "environment"],
};



interface PageProps {
  params: Promise<{ categoryKey: string }>;
}

/** latestYear JSON から yearCode を抽出 */
function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed = typeof latestYear === "string"
      ? JSON.parse(latestYear)
      : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch { /* fallback */ }
  return "2024";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryKey } = await params;

  try {
    const catResult = await findCategoryByKey(categoryKey);
    const category = isOk(catResult) ? catResult.data : null;

    if (!category) {
      return { title: "ページが見つかりません" };
    }

    const title = `${category.categoryName} | 統計で見る都道府県`;
    const description = `${category.categoryName}に関する都道府県別ランキング一覧。47都道府県を統計データで比較できます。`;

    return {
      title,
      description,
      alternates: {
        canonical: `/category/${categoryKey}`,
      },
      ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
    };
  } catch {
    return { title: "ランキング一覧" };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { categoryKey } = await params;

  const catResult = await findCategoryByKey(categoryKey);
  const category = isOk(catResult) ? catResult.data : null;

  if (!category) {
    notFound();
  }

  const fallbackTags = CATEGORY_FALLBACK_TAGS[categoryKey] ?? [];

  const [rankingResult, latestArticles, surveysResult, nativeBanners] = await Promise.all([
    readRankingItemsByCategoryFromR2(categoryKey),
    listLatestArticles(4).catch(() => []),
    readSurveysFromR2().then((r) => isOk(r) ? r.data : []).catch(() => []),
    fallbackTags.length > 0
      ? resolveAffiliateBanners(fallbackTags, 4).catch(() => [])
      : Promise.resolve([]),
  ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];

  // Hero KPI 算出
  const featuredCount = rankingItems.filter((i) => i.isFeatured).length;
  const latestYear = rankingItems
    .map((i) => parseLatestYear(i.latestYear))
    .filter((y) => y && y.match(/^\d{4}$/))
    .sort()
    .pop() ?? "";

  // テーブル用データ
  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: "prefecture",
      title: item.subtitle ? `${item.title} (${item.subtitle})` : item.title,
      subtitle: item.subtitle,
      latestYear,
      unit: item.unit,
      description: item.description,
      demographicAttr: item.demographicAttr,
      normalizationBasis: item.normalizationBasis,
    };
  });

  // 注目ランキング（タイルマップSVG付き、rankingKey で重複排除）
  const seenKeys = new Set<string>();
  const featuredRaw = rankingItems.filter((item) => {
    if (!item.isFeatured) return false;
    if (seenKeys.has(item.rankingKey)) return false;
    seenKeys.add(item.rankingKey);
    return true;
  });

  // 1位データ + 全47件データを並列取得
  const batchItems = featuredRaw.map((item) => ({
    rankingKey: item.rankingKey,
    yearCode: parseLatestYear(item.latestYear),
  }));
  const [batchResult, ...allValuesResults] = await Promise.all([
    readTopRankingValuesBatchFromR2(batchItems, "prefecture"),
    ...featuredRaw.map((item) =>
      readRankingValuesFromR2(item.rankingKey, "prefecture", parseLatestYear(item.latestYear))
    ),
  ]);
  const topMap = isOk(batchResult) ? batchResult.data : new Map();

  const featuredItems = featuredRaw.map((item, idx) => {
    const latestYear = parseLatestYear(item.latestYear);
    const top = topMap.get(item.rankingKey);
    const valuesResult = allValuesResults[idx];
    let tileMapSvg: string | undefined;
    if (isOk(valuesResult) && valuesResult.data.length > 0) {
      tileMapSvg = generateMiniTileSvg(
        valuesResult.data.flatMap((v) => v.value !== null ? [{ areaCode: v.areaCode, value: v.value }] : []),
      );
    }
    return {
      rankingKey: item.rankingKey,
      title: item.subtitle ? `${item.title} (${item.subtitle})` : item.title,
      latestYear,
      unit: item.unit,
      topAreaName: top?.areaName,
      topValue: top ? top.value.toLocaleString("ja-JP") : undefined,
      tileMapSvg,
    };
  });

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  if (rankingItems.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      {/* Hero (軽量): カテゴリ名 + 件数 + メタ */}
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          カテゴリ
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {category.categoryName}
          <span className="ml-3 align-middle text-xs font-medium text-muted-foreground">
            {rankingItems.length}件
            {featuredCount > 0 && ` · 注目${featuredCount}件`}
            {latestYear && ` · 最新${latestYear}年`}
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {category.categoryName}分野の都道府県別ランキングを、地図・グラフ・テーブルで比較できます。
        </p>
      </header>

      <div className="flex gap-4 items-start">
        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">
          {/* 注目ランキング */}
          {featuredItems.length > 0 && (
            <section className="mb-8">
              <SectionEyebrow number="1.">注目のランキング</SectionEyebrow>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {featuredItems.map((item) => (
                  <FeaturedRankingCard
                    key={item.rankingKey}
                    rankingKey={item.rankingKey}
                    title={item.title}
                    latestYear={item.latestYear}
                    unit={item.unit}
                    topAreaName={item.topAreaName}
                    topValue={item.topValue}
                    tileMapSvg={item.tileMapSvg}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 全件テーブル */}
          <section className="mb-8">
            <SectionEyebrow number="2.">
              全{rankingItems.length}件のランキング
            </SectionEyebrow>
            <CategoryRankingTable items={allItems} />
          </section>

          {/* In-feed AdSense */}
          <div className="mb-8">
            <InfeedAd
              slotId={CONTENT_FOOTER.slotId}
              format={CONTENT_FOOTER.format}
            />
          </div>

          {/* ネイティブアフィリエイト */}
          {nativeBanners.length > 0 && (
            <section className="mb-8">
              <SectionEyebrow number="3.">このカテゴリで読む</SectionEyebrow>
              <NativeAffiliateRow
                title={`${category.categoryName}の関連書籍・商品`}
                banners={nativeBanners}
                position="category-native"
                trackingCategory={`category-${categoryKey}`}
              />
            </section>
          )}
        </main>

        {/* 右サイドバー（lg以上） */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
          <div className="flex flex-col gap-4">
            {/* 新着記事 */}
            {latestArticles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">新着記事</h3>
                <div className="flex flex-col gap-2">
                  {latestArticles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="group block rounded-sm border border-border overflow-hidden hover:border-primary/50 transition-colors"
                    >
                      <div className="relative aspect-[1200/630] w-full bg-muted overflow-hidden">
                        <ThemeAwareImage
                          lightSrc={`${r2Url}/app/blog/${article.slug}/thumbnail-light.webp`}
                          darkSrc={`${r2Url}/app/blog/${article.slug}/thumbnail-dark.webp`}
                          alt={article.title}
                          fill
                          sizes="256px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 広告 */}
            <AdSenseAd
              format={RANKING_PAGE_FOOTER.format}
              slotId={RANKING_PAGE_FOOTER.slotId}
            />

            {/* 調査から探す */}
            <SurveyCard surveys={surveysResult.map(s => ({ id: s.id, name: s.name }))} />
          </div>
        </aside>
      </div>

      {/* モバイルフォールバック: 広告 */}
      <div className="lg:hidden mt-8 flex justify-center">
        <AdSenseAd
          format={RANKING_PAGE_FOOTER.format}
          slotId={RANKING_PAGE_FOOTER.slotId}
        />
      </div>
    </div>
  );
}
