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
  readCategorySourceSurveysFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import {
  PageShell,
  PageHeader,
  HeroBanner,
  Breadcrumbs,
} from "@/components/layout";
import { CATEGORY_HEROES } from "@/components/layout/page-heroes";
import { RightRailWidgets } from "@/components/rail";
import { SectionHeader } from "@/components/section";

import {
  InContentAdSlot,
  FooterAdSlot,
  NativeAffiliateRow,
} from "@/features/ads";
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
import {
  buildFeaturedRankingCardModel,
  readRankingItemsByCategory,
} from "@/features/ranking/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";
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
    const parsed =
      typeof latestYear === "string" ? JSON.parse(latestYear) : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch {
    /* fallback */
  }
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
      parseLatestYear(b.latestYear).localeCompare(parseLatestYear(a.latestYear))
    )
    .slice(0, limit);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
    const description =
      customDesc ??
      (rankingCount > 0
        ? sampleTitles
          ? `${category.categoryName}に関する都道府県別ランキング ${rankingCount} 件を掲載。${sampleTitles}など、47都道府県を比較・分析できます。`
          : `${category.categoryName}に関する都道府県別ランキング ${rankingCount} 件を掲載。47都道府県を統計データで比較・分析できます。`
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

  const [rankingResult, latestArticles, sourceSurveys, nativeBanners] =
    await Promise.all([
      readRankingItemsByCategory(categoryKey),
      listLatestArticles(4).catch(() => []),
      // このカテゴリの active item の出典調査 (焼き込みサマリ)。全調査リストを出さない
      // (旧実装は readSurveysFromR2 = 全 74 調査を無関係に表示していた。2026-07-14 是正)
      readCategorySourceSurveysFromR2(categoryKey)
        .then((r) => (isOk(r) ? r.data : []))
        .catch(() => []),
      fallbackTags.length > 0
        ? resolveAffiliateBanners(fallbackTags, 4).catch(() => [])
        : Promise.resolve([]),
    ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];

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

  // 1 回の全47件 read から、共通カード用の top / bottom / top3 と地図を導出する。
  // 旧実装の「1位 batch + 全件」の二重 read は行わない。
  const allValuesResults = await Promise.all(
    featuredRaw.map((item) =>
      readRankingValuesFromR2(
        item.rankingKey,
        "prefecture",
        parseLatestYear(item.latestYear)
      )
    )
  );

  const featuredItems = featuredRaw.flatMap((item, idx) => {
    const latestYear = parseLatestYear(item.latestYear);
    const valuesResult = allValuesResults[idx];
    if (!isOk(valuesResult) || valuesResult.data.length === 0) return [];

    const title =
      item.subtitle && !isCaveatNote(item.subtitle)
        ? `${item.title}（${item.subtitle}）`
        : item.title;
    const model = buildFeaturedRankingCardModel({
      rankingKey: item.rankingKey,
      title,
      values: valuesResult.data,
    });
    if (!model) return [];

    return [{
      rankingKey: item.rankingKey,
      title,
      latestYear,
      unit: item.unit,
      model,
    }];
  });

  const r2Url =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  // 都道府県プロフィール (/areas/[code]) への内部リンク用 (静的・同期読み取り。SSG-safe)
  const prefectures = fetchPrefectures();
  const prefMap = new Map(prefectures.map((p) => [p.prefCode, p]));

  if (rankingItems.length === 0) {
    notFound();
  }

  const categoryDescription = getCategoryDescription(categoryKey);

  // hero 画像を持つカテゴリ (CATEGORY_HEROES) は画像付きの HeroBanner に差し替える。
  const categoryHero = CATEGORY_HEROES[categoryKey];

  // 右レールの本文関連ウィジェット（新着記事 + 調査ナビ）。広告・promo は RightRailWidgets が供給する。
  const railTopWidgets = (
    <>
      {/* 新着記事 */}
      {latestArticles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            新着記事
          </h3>
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

      {/* この統計の出典調査 (このカテゴリの item の出典のみ。空ならカード非表示) */}
      <SurveyCard
        surveys={sourceSurveys.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );

  return (
    <PageShell rightRail={<RightRailWidgets topWidgets={railTopWidgets} />}>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: category.categoryName },
        ]}
      />
      {categoryHero ? (
        <HeroBanner
          eyebrow="カテゴリ"
          title={category.categoryName}
          tagline={
            categoryHero.tagline ??
            categoryDescription ??
            `${category.categoryName}分野の都道府県別ランキング ${rankingItems.length} 件を、地図・グラフ・テーブルで比較できます。`
          }
          imageSrc={categoryHero.image.src}
          imageAlt={categoryHero.imageAlt}
        />
      ) : (
        <PageHeader
          eyebrow="カテゴリ"
          title={category.categoryName}
          description={
            categoryDescription ??
            `${category.categoryName}分野の都道府県別ランキング ${rankingItems.length} 件を、地図・グラフ・テーブルで比較できます。`
          }
        />
      )}

      {/* メインコンテンツ */}
      <div className="min-w-0">
        {/* 注目ランキング */}
        {featuredItems.length > 0 && (
          <section className="mb-12">
            <SectionHeader
              title={
                usingFallbackFeatured ? "主要なランキング" : "注目のランキング"
              }
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item) => (
                <FeaturedRankingCard
                  key={item.rankingKey}
                  rankingKey={item.rankingKey}
                  year={item.latestYear}
                  unit={item.unit}
                  model={item.model}
                />
              ))}
            </div>
          </section>
        )}

        {/* 全件テーブル */}
        <section className="mb-12">
          <SectionHeader title={`全${rankingItems.length}件のランキング`} />
          <CategoryRankingTable items={allItems} />
        </section>

        {/* 記事内広告（ハブ面・ページ 1 枠まで。slotId 未発行の間は非表示） */}
        <InContentAdSlot slot={HUB_INCONTENT} />

        {/* ネイティブアフィリエイト */}
        {nativeBanners.length > 0 && (
          <section className="mb-12">
            <SectionHeader title="このカテゴリで読む" />
            <NativeAffiliateRow
              title={`${category.categoryName}の関連書籍・商品`}
              banners={nativeBanners}
              position="category-native"
              trackingCategory={`category-${categoryKey}`}
            />
          </section>
        )}

        {/* 47都道府県から探す (category→area 内部リンク。回遊性 / クロール深度の改善) */}
        <section className="mb-12" aria-labelledby="category-area-links">
          <SectionHeader
            title={<span id="category-area-links">47都道府県から探す</span>}
            description={`${category.categoryName}を含む各都道府県の統計プロファイルを見る`}
          />
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

        {/* コンテンツ末尾の全幅フッター広告 */}
        <FooterAdSlot />
      </div>
    </PageShell>
  );
}
