import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import { SurfaceLinkCard } from '@/components/surface';

import { FooterAdSlot } from '@/features/ads/slots';
import { themeHref } from '@/features/theme-dashboard/config/theme-urls';
import { ALL_THEMES } from '@/features/theme-dashboard/listing.server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  const title = 'テーマダッシュボード一覧';
  const description =
    '少子高齢化・労働・医療・観光・物価・外国人など、テーマ別に都道府県の統計データをダッシュボードで比較分析';
  return {
    title,
    description,
    alternates: { canonical: '/themes' },
    ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
  };
}

export default function ThemesPage() {
  const totalRankings = ALL_THEMES.reduce(
    (acc, t) => acc + t.rankingKeys.length,
    0
  );

  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: 'テーマ' }]}
      />
      <StatisticsScopeNav current="prefectures" />
      <PageHeader
        eyebrow="ディスカバリー"
        title="テーマダッシュボード"
        description={`テーマ別に複数の指標を横断して都道府県を比較できます。少子高齢化・労働・医療・観光・物価など、社会課題に直結するダッシュボードを ${ALL_THEMES.length} 種類。`}
        stats={`全 ${ALL_THEMES.length} テーマ ・ 指標 ${totalRankings} 件 ・ 47 都道府県`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_THEMES.map((theme) => (
          <SurfaceLinkCard
            key={theme.themeKey}
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
        ))}
      </div>

      {/*
        記事内広告は置かない。この面は単一のテーマグリッドしか無く、グリッドの上は
        ファーストビュー・下はフッター広告の直前しか置き場が無いため、置くと必ず
        広告 2 連になる (2026-07-29 是正)。末尾の Multiplex 1 枠に統一する。
      */}
      {/* コンテンツ末尾の全幅フッター広告 */}
      <FooterAdSlot />
    </PageShell>
  );
}
