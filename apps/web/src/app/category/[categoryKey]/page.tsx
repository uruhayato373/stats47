/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPrefectures, REGIONS } from "@stats47/area";
import { getCategoryDescription } from "@stats47/data-configs";
import {
  readRankingValuesFromR2,
  readTopRankingValuesBatchFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateMiniTileSvg } from "@stats47/visualization/server";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import { PageShell, PageHeader } from "@/components/layout";

import { resolveAffiliateBanners } from "@/features/ads/server";
import { listLatestArticles } from "@/features/blog/server";
import { findCategoryByKey } from "@/features/category/server";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  SurveyCard,
  isCaveatNote,
  type CategoryRankingListItem,
} from "@/features/ranking";
import { readRankingItemsByCategory } from "@/features/ranking/server";
import {
  NativeAffiliateRow,
  SectionEyebrow,
  InfeedAd,
} from "@/features/redesign";

import { AdSenseAd, RANKING_PAGE_FOOTER, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** 24時間 ISR */
export const revalidate = 86400;

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

/** 年・調査名の括弧や空白差を無視してタイトルを正規化（重複の代表選びに使う） */
function normalizeTitleForDedup(title: string): string {
  return title
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * isFeatured 指定が無いカテゴリでも「入口」を用意するための代表ランキング抽出。
 * 同義タイトル（年・調査名違い）を畳み、データ年が新しい順に上位 limit 件を返す。
 */
function pickRepresentativeRankings<
  T extends { rankingKey: string; title: string; latestYear?: unknown },
>(items: readonly T[], limit: number): T[] {
  const byTitle = new Map<string, T>();
  for (const item of items) {
    const key = normalizeTitleForDedup(item.title);
    const existing = byTitle.get(key);
    if (
      !existing ||
      parseLatestYear(item.latestYear) > parseLatestYear(existing.latestYear)
    ) {
      byTitle.set(key, item);
    }
  }
  return [...byTitle.values()]
    .sort((a, b) =>
      parseLatestYear(b.latestYear).localeCompare(parseLatestYear(a.latestYear)),
    )
    .slice(0, limit);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoryKey } = await params;

  try {
    const [catResult, rankingResult] = await Promise.all([
      findCategoryByKey(categoryKey),
      readRankingItemsByCategory(categoryKey),
    ]);
    const category = isOk(catResult) ? catResult.data : null;

    if (!category) {
      return { title: "ページが見つかりません" };
    }

    const rankingItems = isOk(rankingResult) ? rankingResult.data : [];
    const rankingCount = rankingItems.length;
    const sampleTitles = rankingItems
      .filter((i) => i.isFeatured)
      .slice(0, 3)
      .map((i) => i.title)
      .join("・");

    const title = `${category.categoryName}`;
    const customDesc = getCategoryDescription(categoryKey);
    const description = customDesc
      ?? (rankingCount > 0
        ? (sampleTitles
            ? `${category.categoryName}に関する都道府県別ランキング ${rankingCount} 件を掲載。${sampleTitles}など、47都道府県を比較・分析できます。`
            : `${category.categoryName}に関する都道府県別ランキング ${rankingCount} 件を掲載。47都道府県を統計データで比較・分析できます。`)
        : `${category.categoryName}に関する都道府県別ランキング一覧。47都道府県を統計データで比較できます。`);

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
    readRankingItemsByCategory(categoryKey),
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
    // 一覧表のタイトル: 定義的 subtitle は同名指標の区別に有用なので括弧付きで残すが、
    // データ注釈 (※系) はタイトルに連結しない (名称が肥大化し読みにくくなるため)。
    const showSubtitle = item.subtitle && !isCaveatNote(item.subtitle);
    return {
      rankingKey: item.rankingKey,
      areaType: "prefecture",
      title: showSubtitle ? `${item.title}（${item.subtitle}）` : item.title,
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
  const featuredReal = rankingItems.filter((item) => {
    if (!item.isFeatured) return false;
    if (seenKeys.has(item.rankingKey)) return false;
    seenKeys.add(item.rankingKey);
    return true;
  });

  // isFeatured 指定が 0 件のカテゴリ (例: commercial) でも先頭に「入口」を出す。
  // 代表ランキング (同義タイトルを畳んでデータ年が新しい順) を fallback として使う。
  const usingFallbackFeatured = featuredReal.length === 0;
  const featuredRaw = usingFallbackFeatured
    ? pickRepresentativeRankings(rankingItems, 6)
    : featuredReal;

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
      title:
        item.subtitle && !isCaveatNote(item.subtitle)
          ? `${item.title}（${item.subtitle}）`
          : item.title,
      latestYear,
      unit: item.unit,
      topAreaName: top?.areaName,
      topValue: top && top.value !== null ? top.value.toLocaleString("ja-JP") : undefined,
      tileMapSvg,
    };
  });

  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  // 都道府県プロフィール (/areas/[code]) への内部リンク用 (静的・同期読み取り。SSG-safe)
  const prefectures = fetchPrefectures();
  const prefMap = new Map(prefectures.map((p) => [p.prefCode, p]));

  if (rankingItems.length === 0) {
    notFound();
  }

  const categoryDescription = getCategoryDescription(categoryKey);
  const statsText = [
    `全 ${rankingItems.length} ランキング`,
    `${usingFallbackFeatured ? "主要" : "注目"} ${usingFallbackFeatured ? featuredRaw.length : featuredCount} 件`,
    latestYear ? `最新 ${latestYear} 年` : null,
    surveysResult.length > 0 ? `関連調査 ${surveysResult.length} 件` : null,
  ]
    .filter(Boolean)
    .join(" ・ ");

  const rightRail = (
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
                <div className="relative aspect-square w-full bg-muted overflow-hidden">
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
      <SurveyCard surveys={surveysResult.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );

  return (
    <PageShell rightRail={rightRail}>
      <PageHeader
        eyebrow="カテゴリ"
        title={category.categoryName}
        description={
          categoryDescription ??
          `${category.categoryName}分野の都道府県別ランキング ${rankingItems.length} 件を、地図・グラフ・テーブルで比較できます。`
        }
        stats={statsText}
      />

      {/* メインコンテンツ */}
      <div className="min-w-0">
          {/* 注目ランキング */}
          {featuredItems.length > 0 && (
            <section className="mb-8">
              <SectionEyebrow number="1.">
                {usingFallbackFeatured ? "主要なランキング" : "注目のランキング"}
              </SectionEyebrow>
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

          {/* 47都道府県から探す (category→area 内部リンク。回遊性 / クロール深度の改善) */}
          <section className="mb-8" aria-labelledby="category-area-links">
            <SectionEyebrow number={nativeBanners.length > 0 ? "4." : "3."}>
              <span id="category-area-links">47都道府県から探す</span>
            </SectionEyebrow>
            <p className="mb-4 text-sm text-muted-foreground">
              {category.categoryName}を含む各都道府県の統計プロファイルを見る
            </p>
            <div className="space-y-4">
              {REGIONS.map((region) => {
                const regionPrefs = region.prefectures
                  .map((code) => prefMap.get(code))
                  .filter((p): p is NonNullable<typeof p> => p != null);
                const headingId = `category-region-${region.regionCode}`;
                return (
                  <section key={region.regionCode} aria-labelledby={headingId}>
                    <h3
                      id={headingId}
                      className="mb-1 text-sm font-semibold text-muted-foreground"
                    >
                      {region.regionName}
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {regionPrefs.map((pref) => (
                        <Link
                          key={pref.prefCode}
                          href={`/areas/${pref.prefCode}`}
                          className="text-sm text-foreground transition-colors hover:text-primary"
                        >
                          {pref.prefName}
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
      </div>
    </PageShell>
  );
}
