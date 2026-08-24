import Link from 'next/link';

import {
  buildMunicipalityEntityPolicy,
  listPublishableMunicipalities,
} from '@stats47/area';
import { getMetricConfig } from '@stats47/data-configs';
import {
  MUNICIPALITY_THEME_CATALOGS,
  getMunicipalityMetricAvailability,
} from '@stats47/data-configs/geo-scope';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';
import { SectionHeader } from '@/components/section';
import { SurfaceLinkCard } from '@/components/surface';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import type { Metadata } from 'next';

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

  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'ホーム', href: '/' }, { label: '市区町村' }]}
      />
      <StatisticsScopeNav current="municipalities" />
      <PageHeader
        eyebrow="市区町村"
        title="市区町村の統計"
        stats={`${entityCount.toLocaleString('ja-JP')} 自治体を比較`}
      />

      <section aria-labelledby="municipality-active-themes">
        <h2
          id="municipality-active-themes"
          className="mb-3 text-lg font-semibold"
        >
          公開中のテーマ
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {activeThemes.map((theme) => (
            <SurfaceLinkCard
              key={theme.slug}
              href={`/municipalities/themes/${theme.slug}`}
              className="block"
            >
              <h3 className="font-semibold text-foreground">{theme.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {theme.metricKeys
                  .map((metricKey) => getMetricConfig(metricKey)?.title)
                  .filter(Boolean)
                  .join('・')}
              </p>
              <p className="mt-3 text-xs font-medium text-primary">
                テーマを見る →
              </p>
            </SurfaceLinkCard>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <SectionHeader title="データ監査中" hideRule />
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
                <h3 className="font-medium text-foreground">{theme.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {availability.status === 'published'
                    ? '公開準備中です。'
                    : availability.reason}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          政令指定都市の行政区や東京23区の集約値を、独立した自治体として誤表示しないための確認を行っています。
        </p>
      </section>

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
