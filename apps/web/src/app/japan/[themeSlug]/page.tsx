import { notFound } from 'next/navigation';

import { getMetricConfig } from '@stats47/data-configs';
import {
  getJapanCatalogTheme,
  listJapanCatalogThemes,
} from '@stats47/data-configs/geo-scope';
import { readJapanSeries } from '@stats47/stats-r2/readers';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { StatisticsScopeNav } from '@/components/navigation';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { JapanMetricChart } from './JapanMetricChart';

import type { Metadata } from 'next';

interface Params {
  themeSlug: string;
}

// ★R2 依存 route (readJapanSeries を runtime で読む)。generateStaticParams を持たせない
//   (nextjs-ssg-preservation.md §generateStaticParams 固着。ranking/areas と同じ理由)。
export const revalidate = 86400;

export function generateMetadata({ params }: { params: Params }): Metadata {
  const theme = getJapanCatalogTheme(params.themeSlug);
  if (!theme) return {};
  const title = `${theme.title} | 日本の統計`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/japan/${theme.themeSlug}` },
    ...generateOGMetadata({
      title,
      description: theme.description,
      imageUrl: '/og-image.jpg',
    }),
  };
}

interface MetricSeriesView {
  metricKey: string;
  title: string;
  description: string;
  unit: string;
  sourceId: string;
  points: { yearName: string; value: number }[];
  latest: { yearName: string; value: number } | null;
}

async function loadMetricSeries(
  metricKeys: string[]
): Promise<MetricSeriesView[]> {
  const views: MetricSeriesView[] = [];
  for (const metricKey of metricKeys) {
    const config = getMetricConfig(metricKey);
    const series = await readJapanSeries(metricKey);
    // ★catalog に載っている以上 series は存在する設計だが、remote R2 未反映など
    //   運用上のズレは起こりうる。無ければ 0 で埋めず、単にそのカードを描かない
    //   (doc 43: 値が無い metric は非表示ではなく catalog 非採用が原則。ここは
    //   catalog は正しいが配信がまだ追いついていない場合の防御的スキップ)。
    if (!series || series.rows.length === 0 || !config) continue;
    const points = series.rows.map((r) => ({
      yearName: r.yearName,
      value: r.value,
    }));
    views.push({
      metricKey,
      title: config.title,
      description:
        config.description ??
        `${config.title}の公式全国値を時系列で示します。線の傾きから長期的な増減を確認できます。`,
      unit: series.rows[0].unit,
      sourceId: series.meta.sourceId,
      points,
      latest: points[points.length - 1] ?? null,
    });
  }
  return views;
}

export default async function JapanThemePage({ params }: { params: Params }) {
  const theme = getJapanCatalogTheme(params.themeSlug);
  if (!theme) notFound();

  const metricViews = await loadMetricSeries(
    theme.metrics.map((m) => m.metricKey)
  );

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '日本', href: '/japan' },
          { label: theme.title },
        ]}
      />
      <StatisticsScopeNav current="japan" />
      <PageHeader
        eyebrow="日本"
        title={theme.title}
        description={theme.description}
        stats={`${metricViews.length} 指標 (公式全国値)`}
      />

      {metricViews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          現在表示できる全国値がありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
          {metricViews.map((m) => (
            <ChartPanel
              key={m.metricKey}
              title={m.title}
              description={
                <>
                  <span className="block">{m.description}</span>
                  {m.latest && (
                    <span className="mt-1 block font-medium text-foreground">
                      最新: {m.latest.yearName}{' '}
                      {m.latest.value.toLocaleString('ja-JP')}
                      {m.unit}
                    </span>
                  )}
                </>
              }
              footer={
                <ChartFooter
                  source={`e-Stat 統計表 ${m.sourceId} (公式全国値)`}
                  rankingLink={`/ranking/${m.metricKey}`}
                  rankingLabel="都道府県ランキングを見る"
                />
              }
            >
              <JapanMetricChart
                title={m.title}
                unit={m.unit}
                points={m.points}
              />
            </ChartPanel>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/** WP6 で全テーマへ展開する際、静的候補一覧が必要になったらここから導出する。 */
export function listAllJapanThemeSlugs(): string[] {
  return listJapanCatalogThemes().map((t) => t.themeSlug);
}
