/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPrefectures } from "@stats47/area";
import { getCategoryDescription } from "@stats47/data-configs/categories";
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";
import {
  readCategorySourceSurveysFromR2,
  readCategoryTopicsFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { Breadcrumbs, PageHeader, PageShell } from "@/components/layout";
import { SectionHeader } from "@/components/section";
import { HorizontalCardCarousel } from "@/components/surface";

import {
  FooterAdSlot,
  InContentAdSlot,
  NativeAffiliateRow,
  RailAdSlot,
  SidebarPromoBanner,
} from "@/features/ads";
import { resolveAffiliateBanners } from "@/features/ads/server";
import { PrefectureNavigator } from "@/features/area-profile";
import { listArticlesByTagKey } from "@/features/blog/server";
import { findCategoryByKey } from "@/features/category/server";
import { PortalBlogCard, PortalCategoryGrid } from "@/features/home-portal";
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

import { ADSENSE_DISPLAY_ENABLED, HUB_INCONTENT, RAIL_RECT } from "@/lib/google-adsense";
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

/**
 * Category と blog Tag は別分類なので暗黙に同一視せず、関連記事の代表タグを明示する。
 * 各タグは blog snapshot の tagMeta に存在し、カテゴリページでは新着順に最大8件を表示する。
 */
const CATEGORY_BLOG_TAG_KEYS: Readonly<Record<string, string>> = {
  landweather: "気候",
  population: "人口",
  laborwage: "労働",
  agriculture: "農業",
  miningindustry: "製造業",
  commercial: "産業構造",
  economy: "経済",
  construction: "住宅",
  energy: "エネルギー",
  tourism: "観光",
  educationsports: "教育",
  administrativefinancial: "地方財政",
  safetyenvironment: "環境",
  socialsecurity: "社会保障",
  international: "多文化共生",
  infrastructure: "インフラ",
  ict: "IT",
};

interface PageProps {
  params: Promise<{ categoryKey: string }>;
}

/** latestYear JSON から yearCode を抽出 */
function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed = typeof latestYear === "string" ? JSON.parse(latestYear) : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch {
    /* fallback */
  }
  return "2024";
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
    const representativeKeySet = new Set(
      RANKING_PROMINENCE_CATEGORIES.find((c) => c.categoryKey === categoryKey)?.representatives.map(
        (r) => r.rankingKey
      ) ?? []
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
  const blogTagKey = CATEGORY_BLOG_TAG_KEYS[categoryKey];

  const [rankingResult, categoryArticles, sourceSurveys, categoryTopics, nativeBanners] =
    await Promise.all([
      readRankingItemsByCategory(categoryKey),
      blogTagKey ? listArticlesByTagKey(blogTagKey, 8).catch(() => []) : Promise.resolve([]),
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
    readerLabel: item.readerLabel,
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
    RANKING_PROMINENCE_CATEGORIES.find((c) => c.categoryKey === categoryKey)?.representatives.map(
      (r) => r.rankingKey
    ) ?? [];
  const itemByKey = new Map(rankingItems.map((item) => [item.rankingKey, item]));
  const featuredRaw = representativeKeys.flatMap((key) => {
    const item = itemByKey.get(key);
    return item ? [item] : [];
  });

  // 1 回の全47件 read から、共通カード用の top / bottom / top3 と地図を導出する。
  // 旧実装の「1位 batch + 全件」の二重 read は行わない。
  const allValuesResults = await Promise.all(
    featuredRaw.map((item) =>
      readRankingValuesFromR2(item.rankingKey, "prefecture", parseLatestYear(item.latestYear))
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

    return [
      {
        rankingKey: item.rankingKey,
        title,
        latestYear,
        unit: item.unit,
        model,
      },
    ];
  });

  // 共通県選択ナビ用（静的・同期読み取り。SSG-safe）
  const prefectures = fetchPrefectures();

  if (rankingItems.length === 0) {
    notFound();
  }

  return (
    <PageShell className="py-5 lg:py-6">
      {/* home と同じ desktop 2ペイン。mobile は主要コンテンツをカテゴリ一覧より先に読む。 */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1 lg:pr-1">
          <SectionHeader title="カテゴリから探す" />
          <PortalCategoryGrid
            variant="sidebar"
            activeCategoryKey={categoryKey}
            surface="category_sidebar"
          />

          {sourceSurveys.length > 0 && (
            <div className="mt-6">
              <SurveyCard
                surveys={sourceSurveys.map((survey) => ({
                  id: survey.id,
                  name: survey.name,
                }))}
                title="このカテゴリの出典調査"
                surface="category_survey"
              />
            </div>
          )}

          {ADSENSE_DISPLAY_ENABLED && (
            <div className="mt-6">
              <RailAdSlot slot={RAIL_RECT} />
            </div>
          )}
          <div className="mt-4">
            <SidebarPromoBanner index={0} />
          </div>
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          <Breadcrumbs
            items={[{ label: "ホーム", href: "/" }, { label: category.categoryName }]}
          />
          <PageHeader
            title={category.categoryName}
            description={`${category.categoryName}に関する都道府県ランキングを、地図やグラフで比較できます。`}
          />

          <div className="space-y-8">
            {/* 注目ランキング */}
            {featuredItems.length > 0 && (
              <section>
                <SectionHeader title="注目のランキング" />
                <HorizontalCardCarousel ariaLabel={`${category.categoryName}の注目ランキング`}>
                  {featuredItems.map((item) => (
                    <FeaturedRankingCard
                      key={item.rankingKey}
                      rankingKey={item.rankingKey}
                      year={item.latestYear}
                      unit={item.unit}
                      model={item.model}
                    />
                  ))}
                </HorizontalCardCarousel>
              </section>
            )}

            {/* Category と Tag の明示対応で絞った関連記事。全体の最新記事は混ぜない。 */}
            {categoryArticles.length > 0 && blogTagKey && (
              <section>
                <SectionHeader
                  title={`${category.categoryName}の新着ブログ`}
                  action={
                    <Link
                      href={`/tag/${blogTagKey}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      すべての記事 →
                    </Link>
                  }
                />
                <HorizontalCardCarousel ariaLabel={`${category.categoryName}の新着ブログ`}>
                  {categoryArticles.map((article) => (
                    <PortalBlogCard
                      key={article.slug}
                      slug={article.slug}
                      title={article.title}
                      surface="category_blog"
                    />
                  ))}
                </HorizontalCardCarousel>
              </section>
            )}

            {/* 全件テーブル */}
            <section>
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
              <section>
                <NativeAffiliateRow
                  banners={nativeBanners}
                  position="category-native"
                  trackingCategory={`category-${categoryKey}`}
                />
              </section>
            )}

            {/* 47都道府県から探す (category→area 内部リンク。回遊性 / クロール深度の改善) */}
            <section aria-labelledby="category-area-links">
              <SectionHeader
                title={<span id="category-area-links">47都道府県から探す</span>}
                description={`${category.categoryName}を含む各都道府県の統計プロファイルを見る`}
              />
              <PrefectureNavigator
                prefectures={prefectures}
                variant="embedded"
                surface="category"
              />
            </section>

            {/* コンテンツ末尾の全幅フッター広告 */}
            <FooterAdSlot />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
