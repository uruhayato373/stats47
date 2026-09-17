import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

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
import {
  AreaProfilePageClient,
  AreaRelatedRankingsCard,
  AreaRelatedBlogArticles,
  CitiesNavCard,
  RelatedAreas,
  generateAreaMetadata,
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
  selectDistinctProfileItems,
} from '@/features/area-profile';
import { getAreaProfileAction } from '@/features/area-profile/server';
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { areaCode } = await params;
  const profile = await getAreaProfileAction(areaCode);

  if (!profile) {
    return {
      title: '地域の特徴が見つかりません',
      description: '指定された地域のデータは存在しません。',
      alternates: { canonical: '/areas' },
    };
  }

  // title / description 差別化（#77 Phase 4）
  // 47 都道府県全てで同一テンプレートだった title を「県の top 強み指標」で差別化。
  // 例: "東京都の統計データ" → "東京都の統計データ｜卸売業年間商品販売額 全国1位 | 47都道府県比較"
  // rank=0 はデータ欠損 (未ランク) のため除外。R2 snapshot に rank=0 が含まれている場合の defense in depth。
  const validStrengths = selectDistinctProfileItems(
    profile.strengths.filter((s) => s.rank >= 1 && s.rank <= 47),
    3
  );
  const topStrength = validStrengths[0];
  const title = topStrength
    ? `${profile.areaName}の統計データ｜${topStrength.indicator} 全国${topStrength.rank}位｜47都道府県比較`
    : `${profile.areaName}の統計データ｜47都道府県比較`;
  const descriptionHighlights = validStrengths
    .map((s) => `${s.indicator} 全国${s.rank}位`)
    .join('、');
  const description = descriptionHighlights
    ? `${profile.areaName}の統計プロファイル。${descriptionHighlights}。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`
    : `${profile.areaName}の特徴を統計データから分析。人口・経済・教育など17カテゴリのデータを全国ランキングで比較。`;

  return generateAreaMetadata({ title, description, areaCode });
}

export default async function AreaProfilePage({ params }: PageProps) {
  const { areaCode } = await params;
  const profile = await getAreaProfileAction(areaCode);

  if (!profile) {
    notFound();
  }

  const [structuredData, breadcrumbStructuredData] = await Promise.all([
    Promise.resolve(generateAreaProfileStructuredData({ profile })),
    Promise.resolve(generateAreaProfileBreadcrumbStructuredData({ profile })),
  ]);

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
          <AreaRelatedRankingsCard profile={profile} limit={4} />

          {/* 県データブック (値+全国順位 + 特産品 + 推移チャート)。
                        databook 未生成の県は従来チャート表示にフォールバックする。 */}
          <Suspense
            fallback={
              <Skeleton
                className="h-64 w-full rounded-none"
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
            <AreaRelatedBlogArticles profile={profile} limit={5} />
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
