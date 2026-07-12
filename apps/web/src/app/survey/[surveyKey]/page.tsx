/**
 * 調査名ハブページ（Server Component）
 *
 * `/survey/{surveyKey}` でアクセスされ、
 * 調査概要 + 関連ランキング一覧を表示。
 */

import { notFound } from 'next/navigation';

import {
  readRankingItemsBySurveyFromR2,
  readRankingValuesFromR2,
  readSurveyByIdFromR2,
} from '@stats47/ranking/server';
import { isOk } from '@stats47/types';
import { generateMiniTileSvg } from '@stats47/visualization/server';

import { ArticleShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard, getSurfaceCardClassName } from '@/components/surface';

import {
  InContentAdSlot,
  FooterAdSlot,
  NativeAffiliateRow,
} from '@/features/ads';
import { resolveAffiliateBanners } from '@/features/ads/server';
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  isCaveatNote,
  type CategoryRankingListItem,
} from '@/features/ranking';
import { getSurveyEditorialContent } from '@/features/survey';

import { HUB_INCONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

/** 24時間 ISR */
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ surveyKey: string }>;
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

  const [rankingResult, nativeBanners] = await Promise.all([
    readRankingItemsBySurveyFromR2(surveyKey),
    // 調査メタから推定可能な tag を渡す (fallback: economy / population)
    resolveAffiliateBanners(['economy', 'population', 'labor'], 4).catch(
      () => []
    ),
  ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];
  const editorial = getSurveyEditorialContent(surveyKey);

  // Hero KPI: 最新年, 注目件数, etc.
  const featuredCount = rankingItems.filter((i) => i.isFeatured).length;
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

  const seenKeys = new Set<string>();
  const featuredRaw = rankingItems.filter((item) => {
    if (!item.isFeatured) return false;
    if (seenKeys.has(item.rankingKey)) return false;
    seenKeys.add(item.rankingKey);
    return true;
  });
  // A型カード用に 47 県データを一括取得し rank1 抽出 + ミニタイルマップ生成 (category と同方式)。
  // survey は A 型既定 (variant 未指定) で home/category と表示を統一する
  // (旧: baseThumbnailUrl の画像サムネイル → No Image 混在を廃止)。
  const featuredValues = await Promise.all(
    featuredRaw.map((item) =>
      readRankingValuesFromR2(
        item.rankingKey,
        'prefecture',
        parseLatestYear(item.latestYear),
      ),
    ),
  );
  const featuredItems = featuredRaw.map((item, idx) => {
    const latestYear = parseLatestYear(item.latestYear);
    const valuesResult = featuredValues[idx];
    let topAreaName: string | undefined;
    let topValue: string | undefined;
    let tileMapSvg: string | undefined;
    if (isOk(valuesResult) && valuesResult.data.length > 0) {
      const top = valuesResult.data.find((v) => v.rank === 1);
      if (top) {
        topAreaName = top.areaName;
        topValue =
          top.value !== null ? top.value.toLocaleString('ja-JP') : undefined;
      }
      tileMapSvg = generateMiniTileSvg(
        valuesResult.data.flatMap((v) =>
          v.value !== null
            ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }]
            : [],
        ),
        undefined,
        undefined,
        item.rankingKey,
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
      demographicAttr: item.demographicAttr,
      normalizationBasis: item.normalizationBasis,
      topAreaName,
      topValue,
      tileMapSvg,
    };
  });

  if (rankingItems.length === 0) {
    notFound();
  }

  const statsText = [
    `全 ${rankingItems.length} ランキング`,
    featuredCount > 0 ? `注目 ${featuredCount} 件` : null,
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
  let sectionNumber = 1;

  return (
    <ArticleShell
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

      {editorial && (
        <section className="mb-12 space-y-8">
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
                <li key={item} className={getSurfaceCardClassName({ className: "text-sm leading-6" })}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {readerQuestions.length > 0 && (
            <div>
              <SectionHeader
                number={String(sectionNumber++)}
                title="国勢調査から答えを探す"
              />
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
            </div>
          )}
        </section>
      )}

      {featuredItems.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            number={String(sectionNumber++)}
            title="注目のランキング"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredItems.map((item) => (
              <FeaturedRankingCard
                key={item.rankingKey}
                rankingKey={item.rankingKey}
                title={item.title}
                topAreaName={item.topAreaName}
                topValue={item.topValue}
                tileMapSvg={item.tileMapSvg}
                latestYear={item.latestYear}
                unit={item.unit}
                demographicAttr={item.demographicAttr}
                normalizationBasis={item.normalizationBasis}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionHeader
          number={String(sectionNumber++)}
          title={`全${rankingItems.length}件のランキング`}
        />
        <CategoryRankingTable items={allItems} />
      </section>

      {/* 記事内広告（ハブ面・ページ 1 枠まで。slotId 未発行の間は非表示） */}
      <InContentAdSlot slot={HUB_INCONTENT} />

      {editorial && (
        <section className="mb-12">
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

      {/* ネイティブアフィリエイト */}
      {nativeBanners.length > 0 && (
        <section className="mb-12">
          <SectionHeader
            number={String(sectionNumber++)}
            title="関連書籍・データブック"
          />
          <NativeAffiliateRow
            title={`${survey.name}に関連する書籍`}
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
