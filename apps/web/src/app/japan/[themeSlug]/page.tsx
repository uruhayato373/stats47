import { notFound } from 'next/navigation';

import { ChartPanel } from '@stats47/components';
import { getMetricConfig } from '@stats47/data-configs';
import { hrefFor } from "@stats47/data-configs/content/href";
import { buildEstatTableUrl } from '@stats47/data-configs/data-source';
import {
  getJapanCatalogTheme,
  scopeHrefsForJapanTheme,
} from '@stats47/data-configs/geo-scope';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { readJapanSeries } from '@stats47/stats-r2/readers';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { PageShell, PageHeader } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';

import { NativeAffiliateRow } from '@/features/ads';
import { THEME_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import { isAreaTheme, ThemeRegionNav } from '@/features/theme-dashboard';
import { THEME_SWITCHER_THEMES } from '@/features/theme-dashboard/server';

import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import { JapanMetricChart } from './JapanMetricChart';

import type { NumericDomainPolicy } from '@stats47/types';
import type { Metadata } from 'next';

interface Params {
  themeSlug: string;
}

// ★R2 依存 route (readJapanSeries を runtime で読む)。generateStaticParams を持たせない
//   (nextjs-ssg-preservation.md §generateStaticParams 固着。ranking/areas と同じ理由)。
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const {themeSlug} = await params;
  const theme = getJapanCatalogTheme(themeSlug);
  if (!theme) return {};
  // 題名に今の地域を入れる (2026-10-31 IA-REGION-THEME-01)
  const title = `全国の${theme.title}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: hrefFor('japan-theme', { themeSlug: theme.themeSlug }) },
    ...generateOGMetadata({
      title,
      description: theme.description,
      imageUrl: DEFAULT_OGP_IMAGE_PATH,
    }),
  };
}

interface MetricSeriesView {
  metricKey: string;
  title: string;
  description: string;
  unit: string;
  sourceId: string;
  trendDomain: NumericDomainPolicy;
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
      // 分母は subtitle が持つ (unit-semantics-standards §4)。落とすと人口100万人当たりの 27 が
      // 「図書館数 27館」と全国の総数に見える (2026-09-27)
      title: config.subtitle && !config.title.includes(config.subtitle) ? `${config.title}（${config.subtitle}）` : config.title,
      description:
        config.description ??
        `${config.title}の公式全国値を時系列で示します。線の傾きから長期的な増減を確認できます。`,
      unit: series.rows[0].unit,
      sourceId: series.meta.sourceId,
      trendDomain: config.visualization.trendDomain,
      points,
      latest: points[points.length - 1] ?? null,
    });
  }
  return views;
}

export default async function JapanThemePage({ params }: { params: Promise<Params> }) {
  const {themeSlug} = await params;
  const theme = getJapanCatalogTheme(themeSlug);
  if (!theme) notFound();

  // 全国テーマは都道府県テーマと同じ slug を使うので、同じ意図軸の広告を出す
  // (THEME_AFFILIATE_MAP の写像を共有。写像が無い slug は空 = 何も描画しない)。
  const themeVertical = THEME_AFFILIATE_MAP[theme.themeSlug];
  const [metricViews, nativeBanners] = await Promise.all([
    loadMetricSeries(theme.metrics.map((m) => m.metricKey)),
    // 写像が無い slug は汎用の案件 (2026-10-31 オーナー決定「すべてのページに広告を出す」)
    resolveAffiliateBannersByVertical(themeVertical, 8).catch(() => []),
  ]);

  return (
    <PageShell>
      {/* パンくずの各段と右端のアイコンから地域・テーマを Sheet で選ぶ (テーマのページと同じ部品・2026-10-31) */}
      <ThemeRegionNav
        themeKey={theme.themeSlug}
        themes={THEME_SWITCHER_THEMES}
        hasAreaPages={isAreaTheme(theme.themeSlug)}
        scopeHrefs={{ ...scopeHrefsForJapanTheme(theme.themeSlug), japan: hrefFor('japan-theme', { themeSlug: theme.themeSlug }) }}
        current="japan"
      />
      <PageHeader
        eyebrow="日本"
        title={`全国の${theme.title}`}
        description={theme.description}
        stats={`${metricViews.length} 指標 (公式全国値)`}
      />

      {metricViews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          現在表示できる全国値がありません。
        </p>
      ) : (
        <PanelGrid className="grid-cols-1 @md:grid-cols-2">
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
                      {formatUnitForDisplay(m.unit)}
                    </span>
                  )}
                </>
              }
              footer={
                <ChartFooter
                  source={`e-Stat 統計表 ${m.sourceId} (公式全国値)`}
                  sourceLink={buildEstatTableUrl(m.sourceId)}
                  rankingLink={hrefFor("ranking", { rankingKey: m.metricKey })}
                  rankingLabel="都道府県ランキングを見る"
                />
              }
            >
              <JapanMetricChart
                title={m.title}
                unit={m.unit}
                points={m.points}
                trendDomain={m.trendDomain}
              />
            </ChartPanel>
          ))}
        </PanelGrid>
      )}

      {/* ネイティブアフィリエイト枠 (テーマページと同じ vertical 解決・読了位置) */}
      {nativeBanners.length > 0 && (
        <div className="mt-8">
          <NativeAffiliateRow
            banners={nativeBanners}
            position="japan-native"
            trackingCategory={`japan-${theme.themeSlug}`}
            variant="three-up"
          />
        </div>
      )}
    </PageShell>
  );
}
