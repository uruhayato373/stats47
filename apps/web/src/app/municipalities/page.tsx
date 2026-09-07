import Link from 'next/link';

import {
  buildMunicipalityEntityPolicy,
  fetchPrefectures,
  listPublishableMunicipalities,
} from '@stats47/area';
import { getMetricConfig } from '@stats47/data-configs';
import {
  MUNICIPALITY_THEME_CATALOGS,
  getMunicipalityMetricAvailability,
} from '@stats47/data-configs/geo-scope';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import {
  RailLinksCard,
  RailPrefectureCard,
  RightRailWidgets,
  type RailLinksCardItem,
} from '@/components/rail';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard, SurfaceSection } from '@/components/surface';

import { generateOGMetadata } from '@/lib/metadata/og-generator';


import type { Metadata } from 'next';

const MUNICIPALITY_STARTER_THEMES = [
  {
    slug: 'population',
    imageSrc: '/images/category-population-hero.webp',
  },
  {
    slug: 'aging-society',
    imageSrc: '/images/category-socialsecurity-hero.webp',
  },
  {
    slug: 'local-finance',
    imageSrc: '/images/category-administrativefinancial-hero.webp',
  },
] as const;

function getMetricTitles(metricKeys: readonly string[]): string[] {
  return [
    ...new Set(
      metricKeys
        .map((metricKey) => getMetricConfig(metricKey)?.title)
        .filter((title): title is string => Boolean(title))
    ),
  ];
}

export function generateMetadata(): Metadata {
  const title = '市区町村の統計';
  const description =
    '市・町・村を同じ条件で比較できる統計を、テーマとランキングから探せます。';
  return {
    title,
    description,
    alternates: { canonical: '/municipalities' },
    ...generateOGMetadata({ title, description, imageUrl: '/og-image.jpg' }),
  };
}

export default function MunicipalitiesHubPage() {
  const policy = buildMunicipalityEntityPolicy();
  const entityCount = listPublishableMunicipalities(policy).length;
  const themes = Object.values(MUNICIPALITY_THEME_CATALOGS);
  const activeThemes = themes.filter((theme) => theme.status === 'active');
  const draftThemes = themes.filter((theme) => theme.status === 'draft');
  const prefectures = fetchPrefectures();
  const activeThemeBySlug = new Map(
    activeThemes.map((theme) => [theme.slug, theme])
  );
  const starterThemeItems = MUNICIPALITY_STARTER_THEMES.flatMap(
    ({ slug, imageSrc }): RailLinksCardItem[] => {
      const theme = activeThemeBySlug.get(slug);
      if (!theme) return [];

      return [
        {
          id: theme.slug,
          label: theme.title,
          href: `/municipalities/themes/${theme.slug}`,
          trackingLabel: `municipality-theme:${theme.slug}`,
          thumbnail: {
            lightSrc: imageSrc,
            darkSrc: imageSrc,
            alt: '',
          },
        },
      ];
    }
  );

  const rightRail = (
    <RightRailWidgets
      topWidgets={
        <RailLinksCard
          title="はじめに見るテーマ"
          items={starterThemeItems}
          layout="media"
          trackingSurface="municipalities_theme"
        />
      }
      midWidgets={
        <RailPrefectureCard
          title="都道府県から市区町村を探す"
          prefectures={prefectures}
          moreLabel="都道府県一覧から探す →"
        />
      }
      bottomWidgets={
        <RailLinksCard
          title="関連する統計"
          items={[
            {
              id: 'prefecture-themes',
              label: '47都道府県のテーマ',
              href: '/themes',
            },
            {
              id: 'prefecture-rankings',
              label: '都道府県ランキング',
              href: '/ranking',
            },
            {
              id: 'japan-statistics',
              label: '日本全体の統計',
              href: '/japan',
            },
          ]}
          layout="list"
        />
      }
    />
  );

  return (
    <PageShell rightRail={rightRail}>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '市区町村' }]}
      />
      <StatisticsScopeNav current="municipalities" />
      <PageHeader
        eyebrow="市区町村"
        title="市区町村の統計"
        description="人口・暮らし・産業・財政など、市区町村の違いを同じ条件で比較できるテーマから探せます。"
        stats={`${entityCount.toLocaleString('ja-JP')} 自治体を比較`}
      />

      <div className="mb-6 xl:hidden">
        <RailLinksCard
          title="はじめに見るテーマ"
          items={starterThemeItems}
          horizontalOnMobile
          trackingSurface="municipalities_theme"
        />
      </div>

      <section aria-labelledby="municipality-active-themes">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2
            id="municipality-active-themes"
            className="text-lg font-semibold"
          >
            公開中のテーマ
          </h2>
          <p className="text-xs text-muted-foreground">
            {activeThemes.length}テーマ
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {activeThemes.map((theme) => {
            const metricTitles = getMetricTitles(theme.metricKeys);
            const visibleMetricTitles = metricTitles.slice(0, 3);

            return (
              <SurfaceLinkCard
                key={theme.slug}
                href={`/municipalities/themes/${theme.slug}`}
                className="group flex min-h-36 flex-col justify-between"
                aria-label={`${theme.title}、${metricTitles.length}指標を見る`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {theme.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {metricTitles.length}指標
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {visibleMetricTitles.join('・')}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                  テーマを見る
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </SurfaceLinkCard>
            );
          })}
        </div>
      </section>

      <SurfaceSection
        className="mt-8"
        aria-labelledby="municipality-data-quality"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          />
          <div className="min-w-0">
            <h2
              id="municipality-data-quality"
              className="font-semibold text-foreground"
            >
              データ品質への取り組み
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              政令指定都市の行政区や東京23区の集約値を、独立した自治体として誤表示しないよう確認しています。
            </p>
          </div>
        </div>

        {draftThemes.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <SectionHeader title="公開準備中のテーマ" hideRule />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {draftThemes.map((theme) => {
                const availability = getMunicipalityMetricAvailability(
                  theme.defaultMetricKey
                );
                return (
                  <div
                    key={theme.slug}
                    className="border border-border bg-muted/20 p-4"
                  >
                    <h3 className="font-medium text-foreground">
                      {theme.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {availability.status === 'published'
                        ? '公開準備中です。'
                        : availability.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SurfaceSection>

      <p className="mt-8 text-sm text-muted-foreground">
        都道府県同士の比較は{' '}
        <Link
          href="/themes"
          className="font-medium text-primary hover:underline"
        >
          都道府県テーマ
        </Link>
        から確認できます。
      </p>
    </PageShell>
  );
}
