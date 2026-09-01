import { notFound } from 'next/navigation';

import {
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  MUNICIPALITY_THEME_CATALOGS,
} from '@stats47/data-configs/geo-scope';
import { readMunicipalityRankingItem } from '@stats47/ranking/server';
import { ChartNoAxesColumnIncreasing } from 'lucide-react';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import { SurfaceLinkCard } from '@/components/surface';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

interface Params {
  themeSlug: string;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { themeSlug } = await params;
  const theme = MUNICIPALITY_THEME_CATALOGS[themeSlug];
  if (!theme || theme.status !== 'active') return {};
  const title = `${theme.title} | 市区町村の統計`;
  const description = `${theme.title}を市・町・村のランキングで比較します。`;
  return {
    title,
    description,
    alternates: { canonical: `/municipalities/themes/${theme.slug}` },
    ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
  };
}

export default async function MunicipalityThemePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { themeSlug } = await params;
  if (!KNOWN_MUNICIPALITY_THEME_SLUGS.has(themeSlug)) notFound();
  const theme = MUNICIPALITY_THEME_CATALOGS[themeSlug];
  if (!theme || theme.status !== 'active') notFound();

  const items = (
    await Promise.all(
      theme.metricKeys.map((key) => readMunicipalityRankingItem(key))
    )
  ).filter((item) => item !== null);

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '市区町村', href: '/municipalities' },
          { label: theme.title },
        ]}
      />
      <StatisticsScopeNav current="municipalities" />
      <PageHeader
        eyebrow="市区町村テーマ"
        title={theme.title}
        stats={`${items.length} 指標`}
      />

      {items.length === 0 ? (
        <div
          role="status"
          className="border border-border bg-muted/20 p-5 text-sm text-muted-foreground"
        >
          配信用データを準備しています。しばらくしてから再度ご確認ください。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <SurfaceLinkCard
              key={item.rankingKey}
              href={`/municipalities/ranking/${item.rankingKey}`}
              className="block"
            >
              <h3 className="font-semibold text-foreground">
                {item.subtitle ? `${item.title}（${item.subtitle}）` : item.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.latestYear.yearName}・
                {item.valueCount.toLocaleString('ja-JP')}自治体
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <ChartNoAxesColumnIncreasing className="size-4" aria-hidden />
                ランキング
              </p>
            </SurfaceLinkCard>
          ))}
        </div>
      )}

      <aside className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        比較対象は市・町・村です。政令指定都市の行政区と、個別自治体ではない集約行は除外しています。
      </aside>
    </PageShell>
  );
}
