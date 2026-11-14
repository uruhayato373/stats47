import { Fragment } from 'react';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import { LinkRowNav } from '@/components/navigation/StatisticsScopeNav';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard } from '@/components/surface';

import { AdRow, composeAdRows, InFeedAdSlot } from '@/features/ads';
import { themeHref } from '@/features/theme-dashboard/config/theme-urls';
import { ALL_THEMES, groupThemesForListing } from '@/features/theme-dashboard/listing.server';

import { CONTENT_FOOTER, THEMES_INDEX_INFEED_1, THEMES_INDEX_INFEED_2 } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  const title = 'テーマダッシュボード一覧';
  const description =
    '少子高齢化・労働・医療・観光・物価・外国人など、テーマ別に都道府県の統計データをダッシュボードで比較分析';
  return {
    title,
    description,
    alternates: { canonical: '/themes' },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

/** インフィード広告を入れる位置 (何件目の後か)。スマホで約 3,100px と約 5,900px */
const THEMES_INDEX_INFEED_AFTER = [20, 40] as const;

export default async function ThemesPage() {
  const totalRankings = ALL_THEMES.reduce(
    (acc, t) => acc + t.rankingKeys.length,
    0
  );
  // サイドバーと同じ分野に分けて並べる (HUB-LIST-FINDABILITY-01。55 テーマが分類なしの同形カードで並んでいた)
  const groups = groupThemesForListing(ALL_THEMES);
  // インフィード広告の位置は分野をまたいで数える (一覧全体の何件目か)
  const groupStarts = groups.map((_, position) =>
    groups.slice(0, position).reduce((total, group) => total + group.themes.length, 0),
  );

  // 広告の段: ページの最後に AdSense 1 つを本文の幅いっぱい (上限 580px) に出す (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)
  const [indexRow] = composeAdRows([['adsense']], [CONTENT_FOOTER], []);
  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: 'テーマ' }]}
      />
      <StatisticsScopeNav current="prefectures" />
      <PageHeader
        eyebrow="指標の横断比較"
        title="テーマダッシュボード"
        description={`テーマ別に複数の指標を横断して都道府県を比較できます。少子高齢化・労働・医療・観光・物価など、社会課題に直結するダッシュボードを ${ALL_THEMES.length} 種類。`}
        stats={`全 ${ALL_THEMES.length} テーマ ・ 指標 ${totalRankings} 件 ・ 47 都道府県 ・ 並び順: ${groups.length} 分野ごと (サイドバーと同じ順)`}
      />

      <LinkRowNav
        label="分野から探す"
        items={groups.map((group) => ({
          key: group.id,
          label: `${group.label} ${group.themes.length}`,
          href: `#theme-group-${group.id}`,
        }))}
        wrap
      />

      {groups.flatMap((group, position) => [
        <div key={`${group.id}-heading`} id={`theme-group-${group.id}`} className="scroll-mt-24">
          <SectionHeader title={group.label} description={`${group.themes.length} テーマ`} hideRule />
        </div>,
        <div key={group.id} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.themes.map((theme, groupIndex) => {
            const index = (groupStarts[position] ?? 0) + groupIndex;
            return (
              <Fragment key={theme.themeKey}>
              <SurfaceLinkCard
                href={themeHref(theme.themeKey)}
                className="block"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {theme.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {theme.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {theme.rankingKeys.length} 指標
                </p>
              </SurfaceLinkCard>
              {/* 一覧が 1 列のとき (スマホ) 20 件目と 40 件目の後にインフィード広告 (2026-11-13 オーナー決定。一覧は約 8,000px 続く) */}
              {index + 1 === THEMES_INDEX_INFEED_AFTER[0] && index + 1 < ALL_THEMES.length && (
                <div className="sm:hidden"><InFeedAdSlot slot={THEMES_INDEX_INFEED_1} /></div>
              )}
              {index + 1 === THEMES_INDEX_INFEED_AFTER[1] && index + 1 < ALL_THEMES.length && (
                <div className="sm:hidden"><InFeedAdSlot slot={THEMES_INDEX_INFEED_2} /></div>
              )}
              </Fragment>
            );
          })}
        </div>,
      ])}

      {/* コンテンツ末尾の全幅フッター広告 */}
      {indexRow.length > 0 && <AdRow cells={indexRow} position="themes-index-row" trackingCategory="themes-index" wide />}
    </PageShell>
  );
}
