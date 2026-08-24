/**
 * 調査名ハブページ（Server Component）
 *
 * `/survey/{surveyKey}` でアクセスされ、
 * 調査概要 + 関連ランキング一覧を表示。
 */

import { notFound } from 'next/navigation';

import { listCategories, METRICS_REGISTRY } from '@stats47/data-configs';
import { THEME_CATALOGS } from '@stats47/data-configs/theme-catalog';
import { resolveThemeSurveyTaxonomy } from '@stats47/ranking';
import {
  readRankingItemsBySurveyFromR2,
  readRankingValuesFromR2,
  readSurveyByIdFromR2,
} from '@stats47/ranking/server';
import { isOk } from '@stats47/types';

import { ArticleShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard, getSurfaceCardClassName } from '@/components/surface';

import {
  InContentAdSlot,
  FooterAdSlot,
  NativeAffiliateRow,
} from '@/features/ads';
import {
  CATEGORY_AFFILIATE_MAP,
  type AffiliateVertical,
} from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import { listArticleSummariesBySurveyId } from '@/features/blog/server';
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  isCaveatNote,
  type CategoryRankingListItem,
} from '@/features/ranking';
import { buildFeaturedRankingCardModel } from '@/features/ranking/server';
import {
  getSurveyEditorialContent,
  selectSurveyRepresentativeRankings,
  SurveyMobileNav,
  SurveyOutboundLinkArea,
  SurveySideNav,
  type SurveyPageNavLink,
} from '@/features/survey';

import { HUB_INCONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { CategoryRankingItem } from '@stats47/ranking/types';
import type { Metadata } from 'next';

/** 24時間 ISR */
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ surveyKey: string }>;
}

/**
 * 調査に属するランキングの categoryKey 最頻値から広告の意図軸 (vertical) を導出する。
 * 写像を持つランキングが 1 件も無い調査 (統計表しか無い等) は economy にフォールバックする。
 */
function dominantVertical(
  items: readonly CategoryRankingItem[]
): AffiliateVertical {
  const counts = new Map<AffiliateVertical, number>();
  for (const item of items) {
    const vertical = item.categoryKey
      ? CATEGORY_AFFILIATE_MAP[item.categoryKey]
      : undefined;
    if (vertical) counts.set(vertical, (counts.get(vertical) ?? 0) + 1);
  }
  let best: AffiliateVertical = 'economy';
  let bestCount = 0;
  for (const [vertical, count] of counts) {
    if (count > bestCount) {
      best = vertical;
      bestCount = count;
    }
  }
  return best;
}

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
  const { surveyKey } = await params;

  try {
    const result = await readSurveyByIdFromR2(surveyKey);
    const survey = isOk(result) ? result.data : null;

    if (!survey) {
      return { title: 'ページが見つかりません' };
    }

    const title = `${survey.name}のランキング一覧`;
    const editorial = getSurveyEditorialContent(surveyKey);
    const description =
      editorial?.summary ??
      `${survey.organization}「${survey.name}」に基づく都道府県別ランキング一覧。47都道府県を統計データで比較できます。`;

    return {
      title,
      description,
      alternates: {
        canonical: `/survey/${surveyKey}`,
      },
      ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
    };
  } catch {
    return { title: '調査別ランキング一覧' };
  }
}

export default async function SurveyPage({ params }: PageProps) {
  const { surveyKey } = await params;

  const surveyResult = await readSurveyByIdFromR2(surveyKey);
  const survey = isOk(surveyResult) ? surveyResult.data : null;

  if (!survey) {
    notFound();
  }

  const rankingResult = await readRankingItemsBySurveyFromR2(surveyKey);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];
  if (rankingItems.length === 0) {
    notFound();
  }

  const categoryCounts = new Map<string, number>();
  for (const item of rankingItems) {
    if (!item.categoryKey) continue;
    categoryCounts.set(
      item.categoryKey,
      (categoryCounts.get(item.categoryKey) ?? 0) + 1
    );
  }
  const relatedCategories = listCategories().flatMap((category) => {
    const count = categoryCounts.get(category.categoryKey) ?? 0;
    return count > 0
      ? [
          {
            categoryKey: category.categoryKey,
            label: category.categoryName,
            count,
          },
        ]
      : [];
  });
  const relatedThemes = Object.values(THEME_CATALOGS)
    .filter((catalog) =>
      resolveThemeSurveyTaxonomy(catalog, METRICS_REGISTRY).surveys.some(
        (entry) => entry.id === surveyKey
      )
    )
    .map((catalog) => ({ key: catalog.key, title: catalog.title }));
  const relatedArticles = await listArticleSummariesBySurveyId(
    surveyKey,
    6
  ).catch(() => []);
  // ★ 2026-07-28: 旧実装は tag を ['economy','population','labor'] に固定しており、
  //   調査の主題 (農林業センサス / 学校基本調査 等) と広告が一切連動していなかった。
  //   この調査に属するランキングの categoryKey 最頻値から vertical を導出する。
  // limit 8 = 縦長を描画側で除外しても 4 件残すための余裕
  const nativeBanners = await resolveAffiliateBannersByVertical(
    dominantVertical(rankingItems),
    8
  ).catch(() => []);
  const editorial = getSurveyEditorialContent(surveyKey);

  // Hero KPI: 最新年, 代表件数, etc.
  const latestYear =
    rankingItems
      .map((i) => parseLatestYear(i.latestYear))
      .filter((y) => y && y.match(/^\d{4}$/))
      .sort()
      .pop() ?? '';

  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: 'prefecture',
      title:
        item.subtitle && !isCaveatNote(item.subtitle)
          ? `${item.title}（${item.subtitle}）`
          : item.title,
      subtitle: item.subtitle,
      latestYear,
      unit: item.unit,
      description: item.description,
      demographicAttr: item.demographicAttr,
      normalizationBasis: item.normalizationBasis,
    };
  });

  // サイト共通の代表集合を優先しつつ、調査固有のカテゴリ分散フォールバックを持つ。
  // 最大8候補まで値を確認し、欠測があっても描画可能な4件を残す。
  const featuredRaw = selectSurveyRepresentativeRankings(rankingItems, 8);
  // home/category と同じカードモデルを、1 回の全47件 read から導出する。
  // (旧: 独自の縦型カード + baseThumbnailUrl の画像サムネイル)。
  const featuredValues = await Promise.all(
    featuredRaw.map((item) =>
      readRankingValuesFromR2(
        item.rankingKey,
        'prefecture',
        parseLatestYear(item.latestYear)
      )
    )
  );
  const featuredItems = featuredRaw
    .flatMap((item, idx) => {
      const latestYear = parseLatestYear(item.latestYear);
      const valuesResult = featuredValues[idx];
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
    })
    .slice(0, 4);

  const statsText = [
    `全 ${rankingItems.length} ランキング`,
    featuredItems.length > 0 ? `代表 ${featuredItems.length} 件` : null,
    latestYear ? `最新 ${latestYear} 年` : null,
    '47 都道府県',
  ]
    .filter(Boolean)
    .join(' ・ ');
  const rankingKeys = new Set(rankingItems.map((item) => item.rankingKey));
  const readerQuestions =
    editorial?.readerQuestions.filter((item) =>
      rankingKeys.has(item.rankingKey)
    ) ?? [];
  const pageLinks: SurveyPageNavLink[] = [
    ...(editorial
      ? [{ href: '#survey-overview', label: 'この調査で分かること' } as const]
      : []),
    ...(featuredItems.length > 0
      ? [{ href: '#representative-rankings', label: '代表ランキング' } as const]
      : []),
    ...(relatedThemes.length > 0
      ? [{ href: '#related-themes', label: '関連テーマ' } as const]
      : []),
    ...(relatedArticles.length > 0
      ? [{ href: '#related-articles', label: '関連記事' } as const]
      : []),
    { href: '#all-rankings', label: `全${rankingItems.length}件のランキング` },
    ...(editorial
      ? [{ href: '#survey-caveats', label: '数字を読むときの注意' } as const]
      : []),
  ];
  const representativeNav = featuredItems.map((item) => ({
    rankingKey: item.rankingKey,
    label: item.title,
  }));
  let sectionNumber = 1;

  return (
    <ArticleShell
      leftRail={
        <SurveySideNav
          pageLinks={pageLinks}
          representativeRankings={representativeNav}
          categories={relatedCategories}
        />
      }
      breadcrumb={
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '調査', href: '/survey' },
            { label: survey.name },
          ]}
        />
      }
    >
      <PageHeader
        eyebrow="政府統計"
        title={survey.name}
        description={
          <>
            <span className="font-medium text-foreground">
              {survey.organization}
            </span>
            {survey.description && (
              <span className="mt-1 block">{survey.description}</span>
            )}
          </>
        }
        stats={statsText}
        actions={
          survey.url ? (
            <a
              href={survey.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-none border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
            >
              公式サイト ↗
            </a>
          ) : undefined
        }
      />

      <SurveyMobileNav pageLinks={pageLinks} categories={relatedCategories} />

      {editorial && (
        <section id="survey-overview" className="mb-12 scroll-mt-24 space-y-8">
          <div>
            <SectionHeader
              number={String(sectionNumber++)}
              title="この調査で分かること"
            />
            <p className="mb-5 text-sm leading-7 text-muted-foreground">
              {editorial.summary}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {editorial.whatYouCanLearn.map((item) => (
                <li
                  key={item}
                  className={getSurfaceCardClassName({
                    className: 'text-sm leading-6',
                  })}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {readerQuestions.length > 0 && (
            <div>
              <SectionHeader
                number={String(sectionNumber++)}
                title={`${survey.name}から答えを探す`}
              />
              <SurveyOutboundLinkArea surface="survey_ranking">
                <div className="grid gap-3 sm:grid-cols-2">
                  {readerQuestions.map((item) => (
                    <SurfaceLinkCard
                      key={item.rankingKey}
                      href={`/ranking/${item.rankingKey}`}
                      className="text-sm font-medium leading-6 text-foreground hover:bg-accent/50"
                    >
                      {item.question}
                      <span className="ml-1 text-primary" aria-hidden="true">
                        →
                      </span>
                    </SurfaceLinkCard>
                  ))}
                </div>
              </SurveyOutboundLinkArea>
            </div>
          )}
        </section>
      )}

      {featuredItems.length > 0 && (
        <section id="representative-rankings" className="mb-12 scroll-mt-24">
          <SectionHeader
            number={String(sectionNumber++)}
            title="代表ランキング"
          />
          <SurveyOutboundLinkArea surface="survey_ranking">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
          </SurveyOutboundLinkArea>
        </section>
      )}

      {relatedThemes.length > 0 && (
        <section id="related-themes" className="mb-12 scroll-mt-24">
          <SectionHeader
            number={String(sectionNumber++)}
            title="この調査を使うテーマ"
          />
          <SurveyOutboundLinkArea surface="survey_theme">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedThemes.map((theme) => (
                <SurfaceLinkCard
                  key={theme.key}
                  href={`/themes/${theme.key}`}
                  className="text-sm font-medium text-foreground hover:bg-accent/50"
                >
                  {theme.title}
                  <span className="ml-1 text-primary" aria-hidden="true">
                    →
                  </span>
                </SurfaceLinkCard>
              ))}
            </div>
          </SurveyOutboundLinkArea>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section id="related-articles" className="mb-12 scroll-mt-24">
          <SectionHeader
            number={String(sectionNumber++)}
            title="この調査を使う記事"
          />
          <SurveyOutboundLinkArea surface="survey_blog">
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedArticles.map((article) => (
                <SurfaceLinkCard
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="text-sm font-medium leading-6 text-foreground hover:bg-accent/50"
                >
                  {article.title}
                  <span className="ml-1 text-primary" aria-hidden="true">
                    →
                  </span>
                </SurfaceLinkCard>
              ))}
            </div>
          </SurveyOutboundLinkArea>
        </section>
      )}

      {/*
        記事内広告はランキング表の「前」に置く。表より後ろに置くと、そこから
        フッター広告までの間は「数字を読むときの注意」(editorial 定義は 75 調査中 1 件)と
        ネイティブアフィリ(在庫ゼロで消える)しか無く、どちらも欠けた調査で広告 2 連になる。
        ランキング表は無条件で必ず描画されるので、ここに置けば必ず両枠が離れる (2026-07-29 是正)。
      */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      <section id="all-rankings" className="mb-12 scroll-mt-24">
        <SectionHeader
          number={String(sectionNumber++)}
          title={`全${rankingItems.length}件のランキング`}
        />
        <SurveyOutboundLinkArea surface="survey_ranking">
          <CategoryRankingTable items={allItems} />
        </SurveyOutboundLinkArea>
      </section>

      {editorial && (
        <section id="survey-caveats" className="mb-12 scroll-mt-24">
          <SectionHeader
            number={String(sectionNumber++)}
            title="数字を読むときの注意"
          />
          <ul className="space-y-3 border bg-muted/30 p-5 text-sm leading-7 text-muted-foreground">
            {editorial.caveats.map((caveat) => (
              <li key={caveat}>・{caveat}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ネイティブアフィリエイト。広告枠に本文セクションの採番を与えない。 */}
      {nativeBanners.length > 0 && (
        <section className="mb-12">
          <NativeAffiliateRow
            banners={nativeBanners}
            position="survey-native"
            trackingCategory={`survey-${surveyKey}`}
          />
        </section>
      )}

      {/* コンテンツ末尾の全幅フッター広告 */}
      <FooterAdSlot />
    </ArticleShell>
  );
}
