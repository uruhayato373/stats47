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
import { readJapanSeries, readKakeiAxisCharts } from '@stats47/stats-r2/readers';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { PageShell, PageHeader } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { SectionHeader } from '@/components/section';

import { AdRow, composeAdRows, isLandscapeBanner } from '@/features/ads';
import { THEME_AFFILIATE_MAP } from '@/features/ads/constants/affiliate-category';
import { resolveAffiliateBannersByVertical } from '@/features/ads/server';
import { ThemeRegionNav } from '@/features/theme-dashboard';
import {
  buildThemeDescription,
  buildThemeTitle,
  themeLeadLabels,
  isAreaTheme,
  THEME_SWITCHER_THEMES,
} from '@/features/theme-dashboard/server';

import { CONTENT_FOOTER, HUB_INCONTENT } from '@/lib/google-adsense';
import { generateOGMetadata } from '@/lib/metadata/og-generator';

import { DEFAULT_OGP_IMAGE_PATH } from '@/config/site';

import { JapanMetricChart } from './JapanMetricChart';
import { KakeiAxisChart } from './KakeiAxisChart';

import type { KakeiAxisChart as KakeiAxisChartData } from '@stats47/stats-r2/types';
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
  // テーマのページ (/themes/テーマ) が「全国の〇〇」なので、日本全体の変化を見せるこのページは「〜の推移」で区別する (2026-10-31)
  // 題と説明文は単位に関係なく theme-seo.ts で作る (2026-11-12 オーナー決定)。指標名は日本のカタログの短い名前、無ければ都道府県のテーマの主な指標
  const japanLabels = theme.metrics.map((m) => m.shortLabel).filter((l): l is string => Boolean(l)).slice(0, 2);
  const labels = japanLabels.length > 0 ? japanLabels : themeLeadLabels(theme.themeSlug);
  const title = buildThemeTitle({ scope: 'japan', themeTitle: theme.title, labels });
  const description = buildThemeDescription({ scope: 'japan', base: theme.description, labels });
  return {
    title,
    description,
    keywords: theme.keywords,
    alternates: { canonical: hrefFor('japan-theme', { themeSlug: theme.themeSlug }) },
    ...generateOGMetadata({
      title,
      description,
      imageUrl: DEFAULT_OGP_IMAGE_PATH,
    }),
  };
}

interface MetricSeriesView {
  metricKey: string;
  title: string;
  description: string | null;
  isKakei: boolean;
  unit: string;
  sourceId: string;
  trendDomain: NumericDomainPolicy;
  points: { yearName: string; value: number }[];
  latest: { yearName: string; value: number } | null;
}

const KAKEI_SERIES_NOTE =
  '家計調査の二人以上世帯の全国値 (品目分類・年次) です。支出額は 1 年の合計で物価の変動を含み、購入数量は買った量の変化を表します。';

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
      title: config.source.kind === 'kakei-chousa'
        ? config.title
        : config.subtitle && !config.title.includes(config.subtitle) ? `${config.title}（${config.subtitle}）` : config.title,
      // 家計調査は全カード共通の注記をページ冒頭に 1 度だけ出す (KAKEI_SERIES_NOTE)。カードごとに同じ文を 11 回並べ、
      // 購入数量のカードにまで「支出額は…」と書いていた (2026-11-02)
      description:
        config.source.kind === 'kakei-chousa'
          ? null
          : config.description ??
            `${config.title}の公式全国値を時系列で示します。線の傾きから長期的な増減を確認できます。`,
      isKakei: config.source.kind === 'kakei-chousa',
      unit: series.rows[0].unit,
      sourceId: series.meta.sourceId,
      trendDomain: config.visualization.trendDomain,
      points,
      latest: points[points.length - 1] ?? null,
    });
  }
  return views;
}

const KAKEI_PERIOD_LABELS: Record<KakeiAxisChartData['period'], string> = {
  'monthly-average': '1か月平均',
  'annual-total': '年間合計',
  balance: '残高',
  'month-total': '月ごとの合計',
};

export default async function JapanThemePage({ params }: { params: Promise<Params> }) {
  const {themeSlug} = await params;
  const theme = getJapanCatalogTheme(themeSlug);
  if (!theme) notFound();

  // 全国テーマは都道府県テーマと同じ slug を使うので、同じ意図軸の広告を出す
  // (THEME_AFFILIATE_MAP の写像を共有。写像が無い slug は空 = 何も描画しない)。
  const themeVertical = THEME_AFFILIATE_MAP[theme.themeSlug];
  const [metricViews, nativeBanners, axisArtifact] = await Promise.all([
    loadMetricSeries(theme.metrics.map((m) => m.metricKey)),
    // 写像が無い slug は汎用の案件 (2026-10-31 オーナー決定「すべてのページに広告を出す」)
    resolveAffiliateBannersByVertical(themeVertical, 8).catch(() => []),
    (themeSlug === 'household-food-spending' || themeSlug === 'household-assets-debt')
      ? readKakeiAxisCharts()
      : Promise.resolve(null),
  ]);
  const axisCharts = axisArtifact?.charts.filter(chart => chart.themeSlug === themeSlug) ?? [];

  // 広告の段 (2026-11-03 オーナー決定): AdSense と PR を 1 行に並べ、本文の幅に入る数だけ左から出す (モバイルは先頭の 1 枠)。
  const [rowCells] = composeAdRows([['adsense', 'affiliate', 'adsense']], [HUB_INCONTENT, CONTENT_FOOTER], nativeBanners.filter(isLandscapeBanner));
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
        title={`全国の${theme.title}の推移`}
        description={theme.description}
        stats={`${metricViews.length} 指標 (公式全国値)`}
      />
      {metricViews.some((m) => m.isKakei) && (
        <p className="mb-4 text-sm text-muted-foreground">{KAKEI_SERIES_NOTE}</p>
      )}

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
                  {m.description && <span className="block">{m.description}</span>}
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
                  rankingLabel={getMetricConfig(m.metricKey)?.source.kind === 'kakei-chousa'
                    ? '県庁所在市のランキングを見る'
                    : '都道府県ランキングを見る'}
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

      {axisCharts.length > 0 && (
        <section className="mt-10" aria-label="家計調査の分類軸別比較">
          <SectionHeader title="2025年の世帯別比較" />
          <p className="mb-5 text-sm text-muted-foreground">
            全国の年間収入・世帯人数・世帯類型・住居の所有関係・月などの分類別の値を示します。各図に記載した世帯区分を確認してください。県庁所在市の順位や全国時系列とは集計軸が異なります。
          </p>
          <PanelGrid className="grid-cols-1 @md:grid-cols-2">
            {axisCharts.map(chart => <ChartPanel
              key={chart.id}
              title={chart.title}
              description={chart.description}
              footer={<ChartFooter
                source={`e-Stat 家計調査 ${(chart.sourceIds ?? [chart.sourceId]).join('・')}（2025年）`}
                sourceLink={buildEstatTableUrl(chart.sourceId)}
                sourceLinks={chart.sourceIds?.map(sourceId => ({ label: `e-Stat 統計表 ${sourceId}`, url: buildEstatTableUrl(sourceId) }))}
                annotation={`${chart.household}・${chart.axis}・${KAKEI_PERIOD_LABELS[chart.period]}・${chart.unit}`}
              />}
            >
              <KakeiAxisChart chart={chart} />
            </ChartPanel>)}
          </PanelGrid>
        </section>
      )}

      {/* ネイティブアフィリエイト枠 (テーマページと同じ vertical 解決・読了位置) */}
      {rowCells.length > 0 && (
        <div className="mt-8">
          <AdRow cells={rowCells} position="japan-row-1" trackingCategory={`japan-${theme.themeSlug}`} />
        </div>
      )}
    </PageShell>
  );
}
