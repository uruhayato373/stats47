/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPrefectures, REGIONS } from "@stats47/area";
import { getCategoryDescription } from "@stats47/data-configs/categories";
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";
import {
  readCategorySourceSurveysFromR2,
  readCategoryTopicsFromR2,
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
import { PortalCategoryGrid } from "@/features/home-portal";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  CategoryTopicGroups,
  SurveyCard,
  isCaveatNote,
  type CategoryRankingListItem,
  type CategoryTopicListItem,
} from "@/features/ranking";
import {
  buildFeaturedRankingCardModel,
  readRankingItemsByCategory,
} from "@/features/ranking/server";

import { HUB_INCONTENT } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { BLOG_THUMBNAIL_ASPECT_CLASS } from "@/lib/metadata/ogp-image";

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
    const representativeKeySet = new Set(
      RANKING_PROMINENCE_CATEGORIES.find((c) => c.categoryKey === categoryKey)
        ?.representatives.map((r) => r.rankingKey) ?? [],
    );
    const sampleTitles = rankingItems
      .filter((i) => representativeKeySet.has(i.rankingKey))
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

  const [rankingResult, latestArticles, sourceSurveys, categoryTopics, nativeBanners] =
    await Promise.all([
      readRankingItemsByCategory(categoryKey),
      listLatestArticles(4).catch(() => []),
      // このカテゴリの active item の出典調査 (焼き込みサマリ)。全調査リストを出さない
      // (旧実装は readSurveysFromR2 = 全 74 調査を無関係に表示していた。2026-07-14 是正)
      readCategorySourceSurveysFromR2(categoryKey)
        .then((r) => (isOk(r) ? r.data : []))
        .catch(() => []),
      // カテゴリ内グループの表示順マニフェスト。旧 snapshot / カタログ未登録カテゴリは
      // 空配列 → 下の分岐で従来の平坦テーブルへ縮退する
      readCategoryTopicsFromR2(categoryKey)
        .then((r) => (isOk(r) ? r.data : []))
        .catch(() => []),
      fallbackTags.length > 0
        ? // limit 8 = 縦長を描画側で除外しても 4 件残すための余裕
          resolveAffiliateBanners(fallbackTags, 8).catch(() => [])
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

  // グループ表示用データ。topicKey は R2 items.json に焼き込まれた値をそのまま使う
  // (分類の SSOT は packages/data-configs/src/topics/)。
  const topicItems: CategoryTopicListItem[] = rankingItems.map((item) => ({
    rankingKey: item.rankingKey,
    title: item.title,
    subtitle: item.subtitle && !isCaveatNote(item.subtitle) ? item.subtitle : null,
    unit: item.unit,
    topicKey: item.topicKey ?? null,
    top1: item.top1 ?? null,
  }));

  // 注目ランキング。選定は索引 (/ranking) と同じ掲載価値スコアの生成物を唯一の根拠にする。
  // 旧実装は metric config の `isFeatured` を見ていたが、2,295 件中 8 件しか設定されておらず、
  // しかもその 8 件は「ホームの注目」と完全に同じだったため、カテゴリの注目が
  // ホームの注目をそのまま映していた (13 カテゴリは別規則の fallback に落ちていた)。
  const representativeKeys =
    RANKING_PROMINENCE_CATEGORIES.find((c) => c.categoryKey === categoryKey)
      ?.representatives.map((r) => r.rankingKey) ?? [];
  const itemByKey = new Map(rankingItems.map((item) => [item.rankingKey, item]));
  const featuredRaw = representativeKeys.flatMap((key) => {
    const item = itemByKey.get(key);
    return item ? [item] : [];
  });

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
                <div
                  className={`relative ${BLOG_THUMBNAIL_ASPECT_CLASS} w-full bg-muted overflow-hidden`}
                >
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
      {/* 左のカテゴリナビは home と同じ「本文内 aside + 自前 grid」方式。
          PageShell は左右レールを併用できない (showLeft = hasLeft && !hasRight で
          契約テストが「右が勝つ」を固定) ため、右レール (広告・出典調査) を保ったまま
          3 カラムにするにはこの形しかない。 */}
      <div className="lg:grid lg:grid-cols-[228px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="mb-8 lg:sticky lg:top-20 lg:mb-0">
          <SectionHeader title="カテゴリ" />
          <PortalCategoryGrid
            variant="sidebar"
            activeCategoryKey={categoryKey}
            surface="category_sidebar"
          />
        </aside>
        <div className="min-w-0">
        {/* 注目ランキング */}
        {featuredItems.length > 0 && (
          <section className="mb-12">
            <SectionHeader title="注目のランキング" />
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
          {categoryTopics.length > 0 ? (
            <CategoryTopicGroups topics={categoryTopics} items={topicItems} />
          ) : (
            <CategoryRankingTable items={allItems} />
          )}
        </section>

        {/* 記事内広告（ハブ面・ページ 1 枠まで。slotId 未発行の間は非表示） */}
        <InContentAdSlot slot={HUB_INCONTENT} />

        {/* ネイティブアフィリエイト。可視要素はバナー画像のみ。 */}
        {nativeBanners.length > 0 && (
          <section className="mb-12">
            <NativeAffiliateRow
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
      </div>
    </PageShell>
  );
}
