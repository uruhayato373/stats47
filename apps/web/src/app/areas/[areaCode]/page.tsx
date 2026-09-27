import { Suspense } from 'react';

import Link from 'next/link';
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
import { AREA_DATABOOK_TEMPLATE } from '@stats47/data-configs';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';

import { PageShell } from '@/components/layout';
import { RailCategoryList, RailLinksCard, RightRailWidgets } from '@/components/rail';
import { RailCard } from '@/components/surface';

import {
  FooterAdSlot,
  InContentAdSlot,
} from '@/features/ads';
import { FurusatoNozeiCard } from '@/features/ads/server';
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
import { AreaGeoInsightsSection } from '@/features/geo-analysis';
import { AREA_THEMES } from '@/features/theme-dashboard/listing.server';

import { ADSENSE_DISPLAY_ENABLED, HUB_INCONTENT } from '@/lib/google-adsense';

import type { Metadata } from 'next';

const AREA_DATABOOK_TOC_ITEMS = [...AREA_DATABOOK_TEMPLATE.sections]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((section) => ({
    id: section.sectionKey,
    label: section.title,
    href: `#databook-${section.sectionKey}`,
  }));

/** 県トップから掘り下げやすい主要テーマ。表示順はテーマ一覧の SSOT に従う。 */
const AREA_RAIL_THEMES = AREA_THEMES.slice(0, 8);

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

      <PageShell
        rightRail={
          <RightRailWidgets
            topWidgets={
              <>
                <RailLinksCard
                  title={`${profile.areaName}の目次`}
                  items={AREA_DATABOOK_TOC_ITEMS}
                  layout="list"
                  trackingSurface="area_sidebar"
                />
                <RailLinksCard
                  title={`${profile.areaName}をテーマから見る`}
                  items={AREA_RAIL_THEMES.map((theme) => ({
                    id: theme.themeKey,
                    label: theme.title,
                    href: `/areas/${areaCode}/${theme.themeKey}`,
                  }))}
                  layout="list"
                  moreLink={{
                    href: '/themes',
                    label: 'すべてのテーマを見る →',
                  }}
                  trackingSurface="area_sidebar"
                />
                <RailCard title="カテゴリから探す" aria-label="カテゴリから探す">
                  <RailCategoryList
                    items={RANKING_PROMINENCE_CATEGORIES}
                    showCount
                    trackingSurface="area_sidebar"
                  />
                </RailCard>
                <RelatedAreas areaCode={areaCode} />
              </>
            }
          />
        }
      >
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">ホーム</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/areas">都道府県一覧</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{profile.areaName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AreaProfilePageClient profile={profile} />

        <main className="min-w-0 space-y-8">
          <AreaRelatedRankingsCard areaName={profile.areaName} highlights={highlights} />

          {/* 県データブック (値+全国順位 + 特産品 + 推移チャート)。
                        databook 未生成の県は従来チャート表示にフォールバックする。 */}
          <Suspense
            fallback={
              <Skeleton
                className="h-64 w-full rounded-card"
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
            <FurusatoNozeiCard
              areaCode={areaCode}
              position="area-furusato-content"
              layout="content"
            />
          </Suspense>

          <Suspense fallback={null}>
            <AreaGeoInsightsSection
              areaCode={areaCode}
              areaName={profile.areaName}
            />
          </Suspense>

          {/* AdSense再開時にだけ共通枠を戻す。県別の収益導線は上の返礼品リンクへ集約する。 */}
          {ADSENSE_DISPLAY_ENABLED && <InContentAdSlot slot={HUB_INCONTENT} />}

          {/* 関連ブログ記事 (P0-AREAS-01 内部リンク強化) */}
          <Suspense fallback={null}>
            <AreaRelatedBlogArticles highlights={highlights} limit={5} />
          </Suspense>

          <CitiesNavCard areaCode={areaCode} areaName={profile.areaName} />

          {/*
                      広告②: 本文末尾。RailAdSlot は右レール(360px)前提の SurfaceCard 枠で、
                      本文カラム(840px)に置くと枠だけレール幅のまま浮く。他のハブ面と同じ
                      本文末尾の Multiplex に揃える (2026-07-29 是正)。RAIL_RECT は
                      home の左レールが引き続き使う。
                    */}
          <FooterAdSlot />
        </main>
      </PageShell>
    </>
  );
}
