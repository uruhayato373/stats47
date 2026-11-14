/**
 * カテゴリページ（Server Component）
 *
 * `/category/{categoryKey}` でアクセスされ、
 * 注目ランキング（コンパクトカード）+ 全件テーブルのハイブリッドレイアウト。
 */

import { notFound } from 'next/navigation';

import { fetchPrefectures } from '@stats47/area';
import { getMetricConfig } from '@stats47/data-configs';
import { getCategoryDescription } from '@stats47/data-configs/categories';
import { hrefFor } from '@stats47/data-configs/content/href';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import { metricDisplayName } from '@stats47/ranking';
import {
  readCategorySourceSurveysFromR2,
  readCategoryTopicsFromR2,
  readRankingValuesFromR2,
} from '@stats47/ranking/server';
import { isOk } from '@stats47/types';
import { ListOrdered, MapPin, Newspaper, TrendingUp } from 'lucide-react';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PageSections } from '@/components/layout/PageShell';
import { RailLinksCard, RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { HorizontalCardCarousel, RailCard, RailNavRow, SectionCard } from '@/components/surface';
import { HorizontalCardCarouselFrame } from '@/components/surface/HorizontalCardCarousel';

import {
  AdRow,
  composeAdRows,
  OperatorProfileCard,
  RailAdSlot,
} from '@/features/ads';
import { PrefectureNavigator } from '@/features/area-profile';
import { listArticlesByTagKey, readPopularArticlesFromR2 } from '@/features/blog/server';
import { findCategoryByKey } from '@/features/category/server';
import { PortalBlogCard } from '@/features/home-portal';
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  SurveyCard,
  isCaveatNote,
  type CategoryRankingListItem,
} from '@/features/ranking';
import {
  buildFeaturedRankingCardModel,
  rankingTop1Label,
  readRankingItemsByCategory,
} from '@/features/ranking/server';

import {
  ADSENSE_DISPLAY_ENABLED,
  CONTENT_FOOTER,
  HUB_INCONTENT,
  CATEGORY_RAIL_STICKY,
  HUB_ROW_2,
  RAIL_RECT,
} from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';
import { blogThumbnailUrl } from '@/lib/metadata/ogp-image';

import { CATEGORY_BLOG_TAG_KEYS } from '@/config/category-blog-tag-keys';
import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

/** 24時間 ISR */
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ categoryKey: string }>;
}

/** latestYear JSON から yearCode を抽出 */
function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed =
      typeof latestYear === 'string' ? JSON.parse(latestYear) : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch {
    /* fallback */
  }
  return '2024';
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
      return { title: 'ページが見つかりません' };
    }

    const rankingItems = isOk(rankingResult) ? rankingResult.data : [];
    const rankingCount = rankingItems.length;
    const representativeKeySet = new Set(
      RANKING_PROMINENCE_CATEGORIES.find(
        (c) => c.categoryKey === categoryKey
      )?.representatives.map((r) => r.rankingKey) ?? []
    );
    const sampleTitles = rankingItems
      .filter((i) => representativeKeySet.has(i.rankingKey))
      .slice(0, 3)
      .map((i) => i.title)
      .join('・');

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
        canonical: hrefFor('category', { categoryKey }),
      },
      ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
    };
  } catch {
    return { title: 'ランキング一覧' };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { categoryKey } = await params;

  const catResult = await findCategoryByKey(categoryKey);
  const category = isOk(catResult) ? catResult.data : null;

  if (!category) {
    notFound();
  }

  const blogTagKey = CATEGORY_BLOG_TAG_KEYS[categoryKey];

  const [
    rankingResult,
    categoryArticles,
    sourceSurveys,
    categoryTopics,
  ] = await Promise.all([
    readRankingItemsByCategory(categoryKey),
    blogTagKey
      ? listArticlesByTagKey(blogTagKey, 8).catch(() => [])
      : Promise.resolve([]),
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
  ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];
  // 広告の段: 新着ブログの後・全ランキングの後・ページの最後に、AdSense 1 つを本文の幅いっぱい (上限 580px) に出す
  // (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)。2 段目はハブ用の HUB_ROW_2 (THEMES_CONTENT はテーマの段に使う)
  const [categoryRow1, categoryRow2, categoryRow3] = composeAdRows(
    [['adsense'], ['adsense'], ['adsense']],
    [HUB_INCONTENT, HUB_ROW_2, CONTENT_FOOTER],
    [],
  );

  const topicLabelByKey = new Map(categoryTopics.map((topic) => [topic.key, topic.label]));
  // テーブル用データ
  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: 'prefecture',
      // 名前の組み立ては調査ハブと同じ共通関数に寄せる (小見出しを括弧で全部つなぐと長すぎて読めない。2026-11-03)
      title: metricDisplayName(item),
      latestYear,
      unit: item.unit,
      top1: rankingTop1Label(item),
      // 話題は R2 items.json に焼き込まれた topicKey をそのまま使う (分類の SSOT は packages/data-configs/src/topics/)
      ...(categoryTopics.length > 0
        ? { topicLabel: topicLabelByKey.get(item.topicKey ?? '') ?? null }
        : {}),
    };
  });
  // 話題で絞り込める一覧にする (調査ハブと同じ部品。旧: 話題ごとの箱を 2 列に並べていた。2026-11-03)
  const topicOptions =
    categoryTopics.length > 0
      ? categoryTopics
          .filter((topic) => allItems.some((item) => item.topicLabel === topic.label))
          .map((topic) => ({ value: topic.label, label: topic.label }))
      : undefined;

  // 注目ランキング。選定は索引 (/ranking) と同じ掲載価値スコアの生成物を唯一の根拠にする。
  // 旧実装は metric config の `isFeatured` を見ていたが、2,295 件中 8 件しか設定されておらず、
  // しかもその 8 件は「ホームの注目」と完全に同じだったため、カテゴリの注目が
  // ホームの注目をそのまま映していた (13 カテゴリは別規則の fallback に落ちていた)。
  const representativeKeys =
    RANKING_PROMINENCE_CATEGORIES.find(
      (c) => c.categoryKey === categoryKey
    )?.representatives.map((r) => r.rankingKey) ?? [];
  const itemByKey = new Map(
    rankingItems.map((item) => [item.rankingKey, item])
  );
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
        'prefecture',
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

    return [
      {
        rankingKey: item.rankingKey,
        title,
        latestYear,
        unit: item.unit,
        valueDisplay: getMetricConfig(item.rankingKey)?.display,
        model,
      },
    ];
  });

  // 共通県選択ナビ用（静的・同期読み取り。SSG-safe）
  const prefectures = fetchPrefectures();

  if (rankingItems.length === 0) {
    notFound();
  }
  // よく読まれている記事 (GA4 の直近 28 日の閲覧数・週次。ブログ・ホームの右レールと同じ台帳)。本文の新着の記事に出したものは除く
  const popularArticles = (await readPopularArticlesFromR2('', 13).catch(() => []))
    .filter((article) => !categoryArticles.some((latest) => latest.slug === article.slug))
    .slice(0, 5);
  // カテゴリ一覧と現在地はサイドバー (AppSidebar) が持つので、ここでは重複させない。
  // 右レール (2026-11-13 オーナー決定・ホームと同じ形): PC で中身が約 600px しかなく本文 (約 3,550px) の下が約 2,900px 空いていたので、
  // 「よく読まれている記事」・運営者のプロフィール・最後に追従する 300×600 を足した。上の AdSense と追従する枠の間には記事の一覧と
  // プロフィールが入る (広告の枠の台帳の noAdjacentSlots)。追従する枠は PC だけ (RailAdSlot の sticky)
  const rightRail = (
    // rail:h-full: 右レールの列 (本文と同じ高さ) まで伸ばし、最後の追従する広告が本文の終わりまで動けるようにする (ホームと同じ)
    <RailStack className="rail:h-full">
      {sourceSurveys.length > 0 && (
        <SurveyCard
          surveys={sourceSurveys.map((survey) => ({
            id: survey.id,
            name: survey.name,
          }))}
          title="このカテゴリの出典調査"
          surface="category_survey"
        />
      )}

      {/* AdSense は調査のカードの後 (最初の画面に置かない)。固定の PR (SidebarPromoBanner) はランキングの指標が
          労働のときだけ出る部品で、ここでは描かれていなかったので外した (2026-10-30) */}
      {ADSENSE_DISPLAY_ENABLED && <RailAdSlot slot={RAIL_RECT} />}
      <RailLinksCard
        title="よく読まれている記事"
        items={popularArticles.map((article) => ({
          id: article.slug,
          label: article.title,
          href: hrefFor('blog', { slug: article.slug }),
          trackingLabel: `popular:${article.slug}`,
          thumbnail: {
            lightSrc: blogThumbnailUrl(article.slug, 'light'),
            darkSrc: blogThumbnailUrl(article.slug, 'dark'),
            alt: '',
          },
        }))}
        layout="ranked"
        trackingSurface="category_blog"
      />
      <OperatorProfileCard />
      {ADSENSE_DISPLAY_ENABLED && <RailAdSlot slot={CATEGORY_RAIL_STICKY} sticky />}
    </RailStack>
  );

  const header = (
    <>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: category.categoryName },
        ]}
      />
      <PageHeader
        title={category.categoryName}
        description={`${category.categoryName}に関する都道府県ランキングを、地図やグラフで比較できます。`}
      />
    </>
  );

  return (
    <PageShell rightRail={rightRail} header={header}>
      {/* 節はカード同士を点線の帯で接ぐ (テンプレートの lyra のダッシュボード。home / ranking 一覧と同じ) */}
      <PageSections>
        {/* 注目ランキング */}
        {featuredItems.length > 0 && (
          <HorizontalCardCarouselFrame title="注目のランキング" icon={<TrendingUp />}>
            <HorizontalCardCarousel
              ariaLabel={`${category.categoryName}の注目ランキング`}
            >
              {featuredItems.map((item) => (
                <FeaturedRankingCard
                  key={item.rankingKey}
                  rankingKey={item.rankingKey}
                  year={item.latestYear}
                  unit={item.unit}
                  valueDisplay={item.valueDisplay}
                  model={item.model}
                />
              ))}
            </HorizontalCardCarousel>
          </HorizontalCardCarouselFrame>
        )}

        {/* Category と Tag の明示対応で絞った関連記事。全体の最新記事は混ぜない。 */}
        {categoryArticles.length > 0 && blogTagKey && (
          <HorizontalCardCarouselFrame
            title={`${category.categoryName}の新着ブログ`}
            icon={<Newspaper />}
            action={
              <SectionIndexLink href={hrefFor('tag', { tagKey: blogTagKey })}>
                すべての記事
              </SectionIndexLink>
            }
          >
            <HorizontalCardCarousel
              ariaLabel={`${category.categoryName}の新着ブログ`}
            >
              {categoryArticles.map((article) => (
                <PortalBlogCard
                  key={article.slug}
                  slug={article.slug}
                  title={article.title}
                  surface="category_blog"
                />
              ))}
            </HorizontalCardCarousel>
          </HorizontalCardCarouselFrame>
        )}

      </PageSections>

      {/* 広告はカードではないので、カードの格子の外に置く (格子を分け、間に置く)。
          新着ブログの後・全ランキングの前に置き、後ろの PR の列と隣り合わせにしない (2026-10-30)。
          無効のときは何も描かないので、格子の帯が余らない */}
      {/* 記事内広告（ハブ面・ページ 1 枠まで。slotId 未発行の間は非表示） */}
      {categoryRow1.length > 0 && <AdRow cells={categoryRow1} position="category-row-1" trackingCategory={`category-${categoryKey}`} wide />}

      <PageSections className="mt-4">
        {/* 全件テーブル */}
        {/* 話題があるカテゴリは話題で絞り込める (調査ハブと同じ部品。2026-11-03) */}
        <SectionCard
          title={`全${rankingItems.length}件のランキング`}
          icon={<ListOrdered />}
          headingAs="h2"
        >
          <CategoryRankingTable items={allItems} topicOptions={topicOptions} />
        </SectionCard>
        {/* 表はページ送りなので、サーバーの HTML に出るリンクは先頭 20 件だけになる。全件のリンクを畳んだ一覧で
            出し、検索エンジンと JavaScript 無しの閲覧でも全ランキングへ辿れるようにする (GSC-INTERNAL-DISCOVERY-01) */}
        <RailCard title={`全 ${allItems.length} 件を名前の一覧で見る`} collapsible bodyClassName="p-0">
          <nav aria-label="すべてのランキング (名前の一覧)" className="grid gap-x-5 px-4 pb-3 sm:grid-cols-2">
            {allItems.map((item) => (
              <RailNavRow key={item.rankingKey} href={hrefFor('ranking', { rankingKey: item.rankingKey })} chevron={false}>
                {item.title}
              </RailNavRow>
            ))}
          </nav>
        </RailCard>
      </PageSections>

      {/* 広告の段 (PR が先頭。モバイルは PR) */}
      {categoryRow2.length > 0 && (
        <section className="mt-4">
          <AdRow cells={categoryRow2} position="category-row-2" trackingCategory={`category-${categoryKey}`} wide />
        </section>
      )}

      <PageSections className="mt-4">
        {/* 47都道府県から探す (category→area 内部リンク。回遊性 / クロール深度の改善) */}
        <SectionCard
          title="47都道府県から探す"
          icon={<MapPin />}
          headingAs="h2"
          aria-label="47都道府県から探す"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            {`${category.categoryName}を含む各都道府県の統計プロファイルを見る`}
          </p>
          <PrefectureNavigator
            prefectures={prefectures}
            variant="embedded"
            surface="category"
          />
        </SectionCard>
      </PageSections>

      {/* ページ末の広告の段 */}
      {categoryRow3.length > 0 && (
        <div className="mt-4">
          <AdRow cells={categoryRow3} position="category-row-3" trackingCategory={`category-${categoryKey}`} wide />
        </div>
      )}
    </PageShell>
  );
}
