import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { lookupArea } from '@stats47/area';
import { selectAreaHighlights } from '@stats47/area-profile';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@stats47/components/atoms/ui/breadcrumb';
import { Skeleton } from '@stats47/components/atoms/ui/skeleton';
import { AREA_DATABOOK_TEMPLATE, getMetricConfig } from '@stats47/data-configs';
import { hrefFor } from '@stats47/data-configs/content/href';
import { MUNICIPALITY_PREFECTURE_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import { municipalityPrefectureAreaLabel } from '@stats47/ranking';

import Link from '@/components/atoms/SiteLink';
import { PageShell, PanelGrid } from '@/components/layout';
import { LinkRowNav } from '@/components/navigation/StatisticsScopeNav';
import { RailLinksCard } from '@/components/rail';

import {
  AdRow,
  composeAdRows,
} from '@/features/ads';
import { resolveGenericAffiliateBanners } from '@/features/ads/server';
import { AreaDatabookSection } from '@/features/area-databook';
import { getAreaDatabook } from '@/features/area-databook/server';
import {
  AreaProfilePageClient,
  AreaRelatedRankingsCard,
  AreaRelatedBlogArticles,
  CitiesNavCard,
  RelatedAreas,
  generateAreaMetadata,
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
} from '@/features/area-profile';
import { AreaGeoInsightsSection } from '@/features/geo-analysis/area';
import { AREA_THEMES } from '@/features/theme-dashboard/listing.server';

import { CONTENT_FOOTER, HUB_INCONTENT } from '@/lib/google-adsense';

import type { Metadata } from 'next';

const AREA_DATABOOK_TOC_ITEMS = [...AREA_DATABOOK_TEMPLATE.sections]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((section) => ({
    key: section.sectionKey,
    label: section.title,
    href: `#databook-${section.sectionKey}`,
  }));

/** 特別区を持つのは東京都だけ (カードの見出しの「市区町村 / 市町村」) */
const TOKYO_AREA_CODE = '13000';
const FEATURED_THEME_COUNT = 8;

/** 県内の市町村ランキング (県名×市区町村ランキング・MUNI-PREF-RANKING-ROUTE-01) への導線。 */
const MUNICIPALITY_PREFECTURE_RANKING_LINKS = [...MUNICIPALITY_PREFECTURE_RANKING_KEYS].map(
  (rankingKey) => ({ rankingKey, label: getMetricConfig(rankingKey)?.title ?? rankingKey })
);

/** 県トップから全ての県×テーマページを辿れるよう、主要テーマと残りを分ける。 */
const FEATURED_AREA_THEMES = AREA_THEMES.slice(0, FEATURED_THEME_COUNT);
const OTHER_AREA_THEMES = AREA_THEMES.slice(FEATURED_THEME_COUNT);

/**
 * オンデマンド ISR（24時間）。
 *
 * generateStaticParams は付けない。付けると 47 県が `●` SSG 化され、ビルド時に R2 から
 * area profile を読めず notFound として prerender される。この OpenNext 構成では ISR 再生成が
 * 効かず「地域の特徴が見つかりません」が永久固着する（2026-06-22 障害）。generateStaticParams
 * なし = `ƒ`（オンデマンド）でランタイムに R2 を読んで描画する（ranking / areas/[themeSlug] と同方式）。
 * 詳細: .claude/rules/nextjs-ssg-preservation.md
 */
export const revalidate = 86400;

interface PageProps {
  params: Promise<{ areaCode: string }>;
}

/** 「特徴」カードの上位・下位それぞれの件数 (関連ブログ記事・構造化データも同じ選定結果を使う)。 */
const CARD_HIGHLIGHTS_PER_GROUP = 4;
/** title / description に使う上位の件数。 */
const METADATA_HIGHLIGHTS = 3;

/**
 * 県名は地域マスタ、「特徴」は databook.json から選定関数で作る。
 * 県の profile.json は読まない (AREA-HIGHLIGHTS-SSOT-01)。
 */
async function loadArea(areaCode: string) {
  const area = lookupArea(areaCode);
  if (!area || area.areaType !== 'prefecture') return null;
  // databook の読み込み失敗でページ全体を落とさない (特徴カードと title の強調が消えるだけにする)。
  const databook = await getAreaDatabook(areaCode)
    .then((data) => data.databook)
    .catch(() => null);
  return { areaCode, areaName: area.areaName, databook };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { areaCode } = await params;
  const profile = await loadArea(areaCode);

  if (!profile) {
    return {
      title: '地域の特徴が見つかりません',
      description: '指定された地域のデータは存在しません。',
      alternates: { canonical: '/areas' },
    };
  }

  // title / description 差別化（#77 Phase 4）。「特徴」カードと同じ選定関数の上位だけを使うので、
  // title は databook.json (選定入力) が変わるときにしか変わらない。
  const { top } = selectAreaHighlights(profile.databook, { perGroup: METADATA_HIGHLIGHTS });
  const topStrength = top[0];
  const title = topStrength
    ? `${profile.areaName}の統計データ｜${topStrength.label} 全国${topStrength.rank}位｜47都道府県比較`
    : `${profile.areaName}の統計データ｜47都道府県比較`;
  const descriptionHighlights = top
    .map((s) => `${s.label} 全国${s.rank}位`)
    .join('、');
  const description = descriptionHighlights
    ? `${profile.areaName}の統計プロファイル。${descriptionHighlights}。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`
    : `${profile.areaName}の特徴を統計データから分析。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`;

  return generateAreaMetadata({ title, description, areaCode });
}

export default async function AreaProfilePage({ params }: PageProps) {
  const { areaCode } = await params;
  const profile = await loadArea(areaCode);

  if (!profile) {
    notFound();
  }

  const highlights = selectAreaHighlights(profile.databook, {
    perGroup: CARD_HIGHLIGHTS_PER_GROUP,
  });
  const structuredData = generateAreaProfileStructuredData({ profile, highlights });
  const breadcrumbStructuredData = generateAreaProfileBreadcrumbStructuredData({ profile });
  // 広告の段 (2026-11-03 オーナー決定): AdSense と PR を 1 行に並べ、本文の幅に入る数だけ左から出す (モバイルは先頭の 1 枠)。
  // 旧: デスクトップだけの本文とページ末の AdSense。PR は共通の案件 (県の返礼品のカードは別に残る)
  const [areaRow1, areaRow2] = composeAdRows(
    [['adsense', 'affiliate'], ['affiliate', 'adsense']],
    [HUB_INCONTENT, CONTENT_FOOTER],
    await resolveGenericAffiliateBanners(2).catch(() => []),
  );
  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />

      {/* 右レールは持たない。目次は h1 の直後の 1 行のナビにし、最初の画面に「特徴」カードを出す */}
      <PageShell>
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/areas" />}>都道府県一覧</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{profile.areaName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AreaProfilePageClient profile={profile} />

        <LinkRowNav
          label={`${profile.areaName}の目次`}
          items={AREA_DATABOOK_TOC_ITEMS}
          className="mb-4"
        />

        <PanelGrid>
          <AreaRelatedRankingsCard areaName={profile.areaName} highlights={highlights} />

          {/* 関連ブログ記事 (P0-AREAS-01 内部リンク強化) */}
          <Suspense fallback={null}>
            <AreaRelatedBlogArticles areaCode={areaCode} highlights={highlights} limit={3} />
          </Suspense>

          {/* 県データブック (値+全国順位 + 特産品 + 推移チャート)。
                        databook 未生成の県は従来チャート表示にフォールバックする。 */}
          <Suspense
            fallback={
              <Skeleton
                className="h-64 w-full"
                aria-label={`${profile.areaName}のデータブックを読み込んでいます`}
              />
            }
          >
            <AreaDatabookSection
              areaCode={areaCode}
              areaName={profile.areaName}
            />
          </Suspense>

          <Suspense fallback={null}>
            <AreaGeoInsightsSection
              areaCode={areaCode}
              areaName={profile.areaName}
            />
          </Suspense>

          {/* AdSense再開時にだけ共通枠を戻す。県別の収益導線は上の返礼品リンクへ集約する。 */}
          {areaRow1.length > 0 && (
            <AdRow cells={areaRow1} position="area-row-1" trackingCategory={`area-${areaCode}`} />
          )}

          <CitiesNavCard areaCode={areaCode} areaName={profile.areaName} />

          <div className="@container">
            <PanelGrid className="grid-cols-1 @min-[40rem]:grid-cols-2">
              <RailLinksCard
                title={`${profile.areaName}をテーマから見る`}
                items={FEATURED_AREA_THEMES.map((theme) => ({
                  id: theme.themeKey,
                  label: theme.title,
                  href: hrefFor('area-theme', { areaCode, themeSlug: theme.themeKey }),
                }))}
                layout="list"
                moreLink={{
                  href: '/themes',
                  label: '全国のテーマ一覧を見る →',
                }}
                trackingSurface="area_sidebar"
              />
              <RailLinksCard
                title={`${profile.areaName}のその他のテーマ`}
                items={OTHER_AREA_THEMES.map((theme) => ({
                  id: theme.themeKey,
                  label: theme.title,
                  href: hrefFor('area-theme', { areaCode, themeSlug: theme.themeKey }),
                }))}
                layout="list"
                collapsible
                trackingSurface="area_sidebar"
              />
              <RelatedAreas areaCode={areaCode} />
              <RailLinksCard
                title={`${profile.areaName}の${municipalityPrefectureAreaLabel(areaCode === TOKYO_AREA_CODE)}ランキング`}
                items={MUNICIPALITY_PREFECTURE_RANKING_LINKS.map((link) => ({
                  id: link.rankingKey,
                  label: link.label,
                  href: hrefFor('municipality-pref-ranking', {
                    rankingKey: link.rankingKey,
                    prefCode: areaCode,
                  }),
                }))}
                layout="list"
                trackingSurface="municipality_prefecture"
              />
            </PanelGrid>
          </div>

          {/*
                      広告②: 本文末尾。RailAdSlot は右レール(360px)前提の SurfaceCard 枠で、
                      本文カラム(840px)に置くと枠だけレール幅のまま浮く。他のハブ面と同じ
                      本文末尾の Multiplex に揃える (2026-07-29 是正)。RAIL_RECT は
                      home の左レールが引き続き使う。
                    */}
          {areaRow2.length > 0 && (
            <AdRow cells={areaRow2} position="area-row-2" trackingCategory={`area-${areaCode}`} />
          )}
        </PanelGrid>
      </PageShell>
    </>
  );
}
