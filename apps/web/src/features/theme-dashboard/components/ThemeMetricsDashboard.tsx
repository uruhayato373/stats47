'use client';

import { useMemo, type ReactNode } from 'react';

import Link from 'next/link';

import { lookupArea } from '@stats47/area';
import { ArrowRight } from 'lucide-react';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';
import type { PageComponent } from '@/components/stat-charts';

import {
  PREFECTURE_SET_LABEL,
  type ThemeConfig,
  type ThemeIndicatorData,
} from '../types';

import { FixedYearComparisonPanel } from './FixedYearComparisonPanel';
import {
  isMultiMetricGroup,
  isSingleMetricGroup,
  type MetricKpi,
  type MultiMetricGroup,
  type SingleMetricGroup,
} from './metric-kpi';
import { MetricSwitcherPanel } from './MetricSwitcherPanel';
import { SingleMetricCard } from './SingleMetricCard';
import { ThemeComparisonSection } from './ThemeComparisonSection';
import { ThemeDbChartRenderer } from './ThemeDbChartRenderer';

import type {
  CatalogMetricGroup,
  CatalogSection,
} from '@stats47/data-configs/theme-catalog';

interface Props {
  /** テーマ設定 */
  themeConfig: ThemeConfig;
  /**
   * 指標カードの編成 (ThemeCatalog.metricGroups)。未定義なら
   * 「非 context 指標を 1 グループ」にフォールバックする。
   */
  metricGroups?: CatalogMetricGroup[];
  sections?: CatalogSection[];
  embeddedSections?: Record<string, ReactNode>;
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** ThemeCatalog から生成し R2 配信するチャート（page_components） */
  pageCharts?: PageComponent[];
  /** componentKey ごとに survey taxonomy から解決した出典調査ハブ。 */
  chartSourceLinks?: Record<string, Array<{ label: string; url: string }>>;
  /** 選択中の都道府県コード（null = 47都道府県・未選択。e-Stat の "00000" ではない） */
  selectedPrefectureCode: string | null;
  /**
   * true のとき KPI スタットカードのみ描画し、時系列チャート・考察
   * (markdown-section) を出さない。hideMap のカードのみビュー用。
   */
  cardsOnly?: boolean;
}

/** KPI 計算に十分な観測数（47 都道府県の大半が揃っている指標のみ採用） */
const MIN_VALUES_FOR_KPI = 10;
/** ThemeDbChartRenderer が描画できないコンポーネントタイプは除外 */
const NON_CHART_TYPES = new Set(['kpi-card', 'markdown-section']);

function resolveChartAnnotation(chart: PageComponent): string | undefined {
  const value = chart.componentProps.annotation;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveChartRankingLinks(
  chart: PageComponent
): Array<{ label: string; url: string }> | undefined {
  const value = chart.componentProps.rankingLinks;
  if (!Array.isArray(value)) return undefined;

  const links = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    return label && url ? [{ label, url }] : [];
  });
  return links.length > 0 ? links : undefined;
}

/**
 * テーマページのフル幅ダッシュボード
 *
 * /areas/[code]/[category] と同様のスタイルで、テーマの主要指標を
 * 「KPI カード + 時系列チャート + 考察」として一画面に集約する。
 *
 * - KPI カード: tabIndicators（role≠context の指標）を indicatorDataMap から導出。
 *   都道府県選択時はその県の値・全国順位、未選択時は実在する1位県の値 (topRanked) を表示する
 *   (47県平均や全国値を「代表値」として作らない。GEO-SCOPE-SEPARATION-01 WP2)。
 * - 時系列チャート: page_components の line/mixed/composition 等を ThemeDbChartRenderer で描画。
 *   従来 PrefectureStatsPanel は kpi-card 不在のため section 付きチャートを描画できず、
 *   全テーマで埋め草になっていた（本コンポーネントが置き換える）。
 * - markdown-section: 考察テキストを末尾にフル幅で描画。
 *
 * ★page_components チャート (ThemeDbChartRenderer) は KPI パネルとは別経路。e-Stat の全国行
 * ("00000") を `selectNationalSeries` 経由で正しく優先し、無ければ「全国平均」と明示して
 * フォールバックする既存の健全な実装なので、未選択時も prefCode="00000" で描画を続ける
 * (WP2 が除去するのは KPI タイルの「平均を代表値として見せる」経路であり、この page_components
 * 経路の正しい official/average 出し分けではない)。
 */
export function ThemeMetricsDashboard({
  themeConfig,
  metricGroups,
  sections,
  embeddedSections = {},
  indicatorDataMap,
  pageCharts,
  chartSourceLinks,
  selectedPrefectureCode,
  cardsOnly,
}: Props) {
  const areaName = selectedPrefectureCode
    ? (lookupArea(selectedPrefectureCode)?.areaName ?? '選択地域')
    : PREFECTURE_SET_LABEL;

  const kpiKeys = useMemo(
    () =>
      [...new Set([
        ...themeConfig.tabIndicators.map((t) => t.rankingKey),
        ...(metricGroups ?? []).filter((group) => group.comparisonYear).flatMap((group) => group.rankingKeys),
      ])].filter(
          (k) =>
            indicatorDataMap[k] &&
            indicatorDataMap[k].rankingValues.length >= MIN_VALUES_FOR_KPI
        ),
    [themeConfig.tabIndicators, metricGroups, indicatorDataMap]
  );

  const kpis = useMemo<MetricKpi[]>(() => {
    const keys = kpiKeys;

    return keys.map((key) => {
      const d = indicatorDataMap[key];
      const total = d.rankingValues.length;
      const source = {
        sourceName:
          d.rankingItem.attribution?.compilation?.name ??
          d.rankingItem.source?.name,
        sourceLink:
          d.rankingItem.attribution?.compilation?.url ??
          d.rankingItem.source?.url,
        sourceLinks: (d.rankingItem.originalSurveys ?? []).map((survey) => ({
          label: survey.name,
          url: `/survey/${survey.id}`,
        })),
      };

      const target = selectedPrefectureCode
        ? d.rankingValues.find((v) => v.areaCode === selectedPrefectureCode)
        : undefined;

      if (selectedPrefectureCode) {
        return {
          metricKey: key,
          title: d.rankingItem.readerLabel ?? d.rankingItem.title,
          unit: target?.unit || d.rankingItem.unit || '',
          yearName: target?.yearName ?? d.rankingItem.latestYear?.yearName,
          value: typeof target?.value === 'number' ? target.value : null,
          rank: target?.rank ?? null,
          total,
          ...source,
          series: d.nationalSeries ?? [],
          topRanked: null,
          isLoading: false,
        };
      }

      // 47都道府県 (未選択) 表示: 「全国」「全国平均」の値を作らず、実在する1位県の
      // 事実をそのまま渡す (ranking を主役にする。doc 43 §7 WP2)。追加 fetch は発生しない
      // (rankingValues に既にある値)。県選択後だけ MetricSwitcherPanel がその県 + 全国系列を
      // 取りに行く (isNational チェックは MetricSwitcherPanel 側が持つ)。
      const top1 = d.rankingValues.find((v) => v.rank === 1);
      const topRanked =
        top1 && typeof top1.value === 'number' && Number.isFinite(top1.value)
          ? {
              areaCode: top1.areaCode,
              areaName: lookupArea(top1.areaCode)?.areaName ?? top1.areaCode,
              value: top1.value,
            }
          : null;

      return {
        metricKey: key,
        title: d.rankingItem.readerLabel ?? d.rankingItem.title,
        unit: top1?.unit || d.rankingItem.unit || '',
        yearName: top1?.yearName ?? d.rankingItem.latestYear?.yearName,
        value: null,
        rank: null,
        total,
        ...source,
        series: d.nationalSeries ?? [],
        topRanked,
        isLoading: false,
      };
    });
  }, [kpiKeys, indicatorDataMap, selectedPrefectureCode]);

  const tabLabels = useMemo(
    () =>
      Object.fromEntries(
        themeConfig.tabIndicators.map((t) => [t.rankingKey, t.tabLabel])
      ),
    [themeConfig.tabIndicators]
  );

  /**
   * 指標カードの編成。カタログの metricGroups を KPI 群に射影する。
   *
   * KPI 側は観測数の足りない指標 (MIN_VALUES_FOR_KPI 未満) を落としているので、
   * グループのキーはここで生存キーに絞り込む。全滅したグループはカードごと出さない
   * (空のカードを置くと「壊れている」と読める)。
   *
   * metricGroups 未定義のテーマ (カタログ未登録のものを含む) は
   * 全 KPI を 1 グループにまとめる = 従来の 1 パネル構成と同じ。
   *
   * ★表示方式は**生存キーの実件数**で決める (2026-09-17)。1 件なら選択 UI の無い
   *   SingleMetricCard、2 件以上なら MetricSwitcherPanel。カタログ定義では 2 件でも
   *   観測不足で 1 件に減れば single に倒す。テーマ別の分岐は持たない。
   */
  const panels = useMemo(() => {
    type Panel = {
      key: string;
      comparisonYear: string | undefined;
      comparisonMap: boolean | undefined;
      title: string | undefined;
      metrics: SingleMetricGroup | MultiMetricGroup;
      defaultCheckedKeys: string[];
    };
    const sized = (metrics: MetricKpi[]) =>
      isSingleMetricGroup(metrics) || isMultiMetricGroup(metrics)
        ? metrics
        : null;
    if (!metricGroups || metricGroups.length === 0) {
      const metrics = sized(kpis);
      return metrics
        ? [
            {
              key: 'default',
              comparisonYear: undefined,
              comparisonMap: undefined,
              // 見出しは section の h2 が既に言っているので重ねない。
              // パネル側が代表指標のタイトルに倒す (= 従来の 1 パネル構成と同じ)
              title: undefined,
              metrics,
              defaultCheckedKeys: [themeConfig.defaultRankingKey],
            } satisfies Panel,
          ]
        : [];
    }
    const byKey = new Map(kpis.map((k) => [k.metricKey, k]));
    return metricGroups.flatMap((group): Panel[] => {
      const metrics = sized(
        group.rankingKeys
          .map((key) => byKey.get(key))
          .filter((m): m is MetricKpi => m !== undefined)
      );
      // 全滅したグループはカードごと出さない (空のカードは「壊れている」と読める)
      if (!metrics) return [];
      const alive = new Set(metrics.map((m) => m.metricKey));
      return [
        {
          key: group.key,
          comparisonYear: group.comparisonYear,
          comparisonMap: group.comparisonMap,
          title: group.title as string | undefined,
          metrics,
          defaultCheckedKeys: group.defaultCheckedKeys.filter((k) =>
            alive.has(k)
          ),
        },
      ];
    });
  }, [metricGroups, kpis, themeConfig.defaultRankingKey]);

  // page_components チャート専用の地域コード。KPI パネル (kpis) とは別経路で、
  // ThemeDbChartRenderer 側が selectNationalSeries 経由で official/average を正しく
  // 出し分けるため、未選択時も "00000" を渡してよい (WP2 が除去する対象ではない)。
  const pageComponentsAreaCode = selectedPrefectureCode ?? '00000';

  // cardsOnly: KPI スタットカードのみ。チャート・考察は描画しない
  const chartComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => !NON_CHART_TYPES.has(c.componentType));
  const markdownComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => c.componentType === 'markdown-section');

  if (
    panels.length === 0 &&
    chartComponents.length === 0 &&
    markdownComponents.length === 0 &&
    Object.keys(embeddedSections).length === 0
  ) {
    return null;
  }

  type Panel = (typeof panels)[number];
  /** 固定年比較と複数指標切替は全幅、1 指標カードはコンパクト (複数並ぶときだけ 2 列) */
  const isCompact = (panel: Panel) =>
    !panel.comparisonYear && isSingleMetricGroup(panel.metrics);
  const renderPanel = (panel: Panel, summaryOnly = false) => panel.comparisonYear ? (
    <FixedYearComparisonPanel
      key={panel.key}
      id={`theme-${themeConfig.themeKey}-panel-${panel.key}`}
      title={panel.title}
      metrics={panel.metrics}
      comparisonYear={panel.comparisonYear}
      indicatorDataMap={indicatorDataMap}
      selectedPrefectureCode={selectedPrefectureCode}
      defaultMetricKey={panel.defaultCheckedKeys[0]}
      tabLabels={tabLabels}
      showMap={panel.comparisonMap}
    />
  ) : isSingleMetricGroup(panel.metrics) ? (
    <SingleMetricCard
      key={panel.key}
      id={`theme-${themeConfig.themeKey}-panel-${panel.key}`}
      summaryOnly={summaryOnly}
      title={panel.title}
      metric={panel.metrics[0]}
      tabLabels={tabLabels}
      selectedPrefectureCode={selectedPrefectureCode}
      areaName={areaName}
    />
  ) : (
    <MetricSwitcherPanel
      key={panel.key}
      id={`theme-${themeConfig.themeKey}-panel-${panel.key}`}
      summaryOnly={summaryOnly}
      title={panel.title}
      metrics={panel.metrics}
      tabLabels={tabLabels}
      selectedPrefectureCode={selectedPrefectureCode}
      areaName={areaName}
      defaultCheckedKeys={panel.defaultCheckedKeys}
    />
  );
  /**
   * パネル列を「連続するコンパクトカードの run」と「全幅パネル」に分け、順序を保ったまま描く。
   * run が 2 件以上のときだけ container query の 2 列 grid で包む。1 件の run に grid wrapper は作らない。
   */
  const renderPanelRuns = (
    list: Panel[],
    summaryOnlyOf: (panel: Panel) => boolean = () => false
  ) => {
    const out: ReactNode[] = [];
    for (let i = 0; i < list.length; ) {
      const panel = list[i];
      if (!isCompact(panel)) {
        out.push(renderPanel(panel, summaryOnlyOf(panel)));
        i += 1;
        continue;
      }
      let j = i;
      while (j < list.length && isCompact(list[j])) j += 1;
      const run = list.slice(i, j);
      if (run.length === 1) {
        out.push(renderPanel(panel, summaryOnlyOf(panel)));
      } else {
        out.push(
          <div
            key={`compact-${panel.key}`}
            data-theme-panel-grid="compact"
            className="grid grid-cols-1 gap-4 @md:grid-cols-2"
          >
            {run.map((item) => renderPanel(item, summaryOnlyOf(item)))}
          </div>
        );
      }
      i = j;
    }
    return out;
  };
  const renderChart = (chart: PageComponent) =>
    chart.componentType === 'markdown-section' ? (
      <ThemeDbChartRenderer
        key={chart.componentKey}
        chart={chart}
        prefCode={pageComponentsAreaCode}
        prefName={areaName}
      />
    ) : (
    <ChartPanel
      key={chart.componentKey}
      id={`theme-${themeConfig.themeKey}-chart-${chart.componentKey}`}
      title={chart.title}
      footer={
        <ChartFooter
          source={chart.sourceName ?? undefined}
          sourceLink={chart.sourceLink}
          sourceLinks={chartSourceLinks?.[chart.componentKey]}
          annotation={resolveChartAnnotation(chart)}
          rankingLink={chart.rankingLink}
          rankingLabel="指標の定義・ランキング"
          rankingLinks={resolveChartRankingLinks(chart)}
        />
      }
    >
      <ThemeDbChartRenderer
        chart={chart}
        prefCode={pageComponentsAreaCode}
        prefName={areaName}
      />
    </ChartPanel>
  );
  // Every block has one owner. Unassigned blocks remain reachable while snapshots roll forward.
  const usedPanels = new Set<string>();
  const usedCharts = new Set<string>();
  const usedEmbedded = new Set<string>();
  const chapters = (sections ?? []).map((section) => {
    const chapterPanels = panels.filter(
      (panel) =>
        section.metricGroupKeys.includes(panel.key) &&
        !usedPanels.has(panel.key)
    );
    const chapterCharts = chartComponents.filter(
      (chart) =>
        section.chartKeys?.includes(chart.componentKey) &&
        !usedCharts.has(chart.componentKey)
    );
    const chapterEmbedded = (section.embeddedSectionKeys ?? []).filter(
      (key) => embeddedSections[key] && !usedEmbedded.has(key)
    );
    chapterPanels.forEach((panel) => usedPanels.add(panel.key));
    chapterCharts.forEach((chart) => usedCharts.add(chart.componentKey));
    chapterEmbedded.forEach((key) => usedEmbedded.add(key));
    return {
      ...section,
      panels: chapterPanels,
      charts: chapterCharts,
      embedded: chapterEmbedded,
    };
  });
  const remainingPanels = panels.filter((panel) => !usedPanels.has(panel.key));
  const remainingCharts = chartComponents.filter(
    (chart) => !usedCharts.has(chart.componentKey)
  );
  const remainingEmbedded = Object.keys(embeddedSections).filter(
    (key) => !usedEmbedded.has(key)
  );

  return (
    <section
      id="theme-indicators"
      className="@container space-y-6 scroll-mt-24"
    >
      <h2 className="sr-only">{areaName}の主要指標</h2>
      {selectedPrefectureCode && (
        <div className="flex justify-end">
          <Link
            href={`/areas/${selectedPrefectureCode}`}
            className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
          >
            {areaName}のプロフィール <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      {chapters.map((chapter) => (
        <section
          key={chapter.key}
          id={`theme-section-${chapter.key}`}
          aria-labelledby={`theme-heading-${chapter.key}`}
          className="space-y-4 scroll-mt-24"
        >
          <div className="border-b border-border pb-3">
            <h2
              id={`theme-heading-${chapter.key}`}
              className="text-lg font-semibold"
            >
              {chapter.title}
            </h2>
            {chapter.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {chapter.description}
              </p>
            )}
          </div>
          {renderPanelRuns(chapter.panels, (panel) => {
            const coveredKeys = new Set(
              chapter.charts.flatMap((chart) =>
                ['seriesRefs', 'columnSeriesRefs', 'lineSeriesRefs'].flatMap(
                  (field) => {
                    const refs = chart.componentProps[field];
                    return Array.isArray(refs)
                      ? refs.flatMap((ref) =>
                          ref &&
                          typeof ref === 'object' &&
                          typeof ref.metricKey === 'string' &&
                          ref.area !== 'national'
                            ? [ref.metricKey as string]
                            : []
                        )
                      : [];
                  }
                )
              )
            );
            return panel.metrics.every((metric) =>
              coveredKeys.has(metric.metricKey)
            );
          })}
          {chapter.charts.length > 0 && (
            <div className={`grid grid-cols-1 gap-4 ${chapter.charts.length > 1 ? "@md:grid-cols-2" : ""}`}>
              {chapter.charts.map(renderChart)}
            </div>
          )}
          {chapter.embedded.map((key) => (
            <div key={key}>{embeddedSections[key]}</div>
          ))}
        </section>
      ))}
      {renderPanelRuns(remainingPanels)}
      {remainingCharts.length > 0 && (
        <div
          id="theme-charts"
          className={`grid scroll-mt-24 grid-cols-1 gap-4 ${remainingCharts.length > 1 ? '@md:grid-cols-2' : ''}`}
        >
          {remainingCharts.map(renderChart)}
        </div>
      )}
      {remainingEmbedded.map((key) => (
        <div key={key}>{embeddedSections[key]}</div>
      ))}
      {!cardsOnly && themeConfig.hideMap && (
        <ThemeComparisonSection
          themeConfig={themeConfig}
          metricGroups={metricGroups}
          indicatorDataMap={indicatorDataMap}
          selectedPrefectureCode={selectedPrefectureCode}
        />
      )}
      {markdownComponents.length > 0 && (
        <div className="space-y-4">
          {markdownComponents.map((chart) => (
            <ThemeDbChartRenderer
              key={chart.componentKey}
              chart={chart}
              prefCode={pageComponentsAreaCode}
              prefName={areaName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
