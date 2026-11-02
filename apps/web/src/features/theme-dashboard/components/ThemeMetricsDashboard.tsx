'use client';

import { useMemo, type ReactNode } from 'react';


import { lookupArea } from '@stats47/area';
import { ChartPanel } from '@stats47/components';
import { hrefFor } from '@stats47/data-configs/content/href';
import { readSourceConfigRef } from '@stats47/data-configs/data-source';
import { resolveChartColorHex, type CatalogMetricGroup, type CatalogSection } from '@stats47/data-configs/theme-catalog';
import { metricDisplayName } from "@stats47/ranking";
import { resolveValuePrecision } from "@stats47/utils";

import { ChartFooter } from '@/components/charts/ChartFooter';
import { SourcesSheet } from '@/components/charts/SourcesSheet';
import { PanelGrid } from '@/components/layout/PageShell';
import { SectionHeader, SectionIndexLink } from '@/components/section';
import type { PageComponent } from '@/components/stat-charts';
import { StatTileGrid } from '@/components/surface';

import {
  NATIONAL_REGION_LABEL,
  type ThemeConfig,
  type ThemeIndicatorData,
} from '../types';

import {
  isMultiMetricGroup,
  isSingleMetricGroup,
  type MetricKpi,
  type MultiMetricGroup,
  type SingleMetricGroup,
} from './metric-kpi';
import { MetricSwitcherPanel } from './MetricSwitcherPanel';
import { SingleMetricCard } from './SingleMetricCard';
import { ThemeDbChartRenderer } from './ThemeDbChartRenderer';


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
 * チャートの先頭の指標ハブ (rankingLink) の名前。2 件目以降 (生成側の rankingLinks) と同じく
 * 「{テーマの短い名前}の定義・ランキング」にする (2026-10-30。旧: 1 件目だけ「指標の定義・ランキング」で、Sheet の中でどの指標か分からなかった)
 */
function primaryRankingLabel(
  rankingLink: string | null | undefined,
  tabIndicators: ReadonlyArray<{ rankingKey: string; tabLabel: string }>,
  indicatorDataMap: Record<string, ThemeIndicatorData>
): string {
  const key = rankingLink?.match(/^\/ranking\/([^/?#]+)/)?.[1];
  const rankingKey = key ? decodeURIComponent(key) : undefined;
  const name = rankingKey
    ? (tabIndicators.find((indicator) => indicator.rankingKey === rankingKey)?.tabLabel ??
      indicatorDataMap[rankingKey]?.rankingItem.title)
    : undefined;
  return name ? `${name}の定義・ランキング` : '指標の定義・ランキング';
}

/**
 * テーマページのフル幅ダッシュボード
 *
 * /areas/[code]/[category] と同様のスタイルで、テーマの主要指標を
 * 「KPI カード + 時系列チャート + 考察」として一画面に集約する。
 *
 * - KPI カード: tabIndicators（role≠context の指標）を indicatorDataMap から導出。
 *   県のページはその県の値・全国順位、全国のページは全国の値 (e-Stat の全国行) を表示する
 *   (47 県の平均を「代表値」として作らない。GEO-SCOPE-SEPARATION-01 WP2)。
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
    : NATIONAL_REGION_LABEL;

  const kpiKeys = useMemo(
    () =>
      // カードに並べると決めた指標は role (context を含む) に関わらず値を出す
      [...new Set([
        ...themeConfig.tabIndicators.map((t) => t.rankingKey),
        ...(metricGroups ?? []).flatMap((group) => group.rankingKeys),
      ])].filter(
          (k) =>
            indicatorDataMap[k] &&
            indicatorDataMap[k].rankingValues.length >= MIN_VALUES_FOR_KPI &&
            // 地域ごとに出す指標を変える (2026-11-01 オーナー決定): 全国のページは公式の全国の値がある指標だけ。
            // 県のページは県の値がある指標 (上の観測数)。市区町村は別のページ (市区町村の指標) が受け持つ
            (selectedPrefectureCode !== null || hasOfficialNational(indicatorDataMap[k]))
        ),
    [themeConfig.tabIndicators, metricGroups, indicatorDataMap, selectedPrefectureCode]
  );

  const kpis = useMemo<MetricKpi[]>(() => {
    const keys = kpiKeys;

    return keys.map((key) => {
      const d = indicatorDataMap[key];
      const total = d.rankingValues.length;
      const configSource = readSourceConfigRef(d.rankingItem.sourceConfig);
      const source = {
        trendDomain: d.rankingItem.visualization.trendDomain,
        sourceName:
          d.rankingItem.attribution?.compilation?.name ?? configSource.name,
        sourceLink:
          d.rankingItem.attribution?.compilation?.url ?? configSource.url,
        sourceLinks: (d.rankingItem.originalSurveys ?? []).map((survey) => ({
          label: survey.name,
          url: hrefFor('survey', { surveyKey: survey.id }),
        })),
      };

      const target = selectedPrefectureCode
        ? d.rankingValues.find((v) => v.areaCode === selectedPrefectureCode)
        : undefined;
      const nationalValue = d.nationalValue;

      // 県のページはその県の値と順位、全国のページは全国の値 (2026-10-31 オーナー決定。旧: 47 都道府県の表示で 1 位の県の値)
      // 単位と年は観測の行から取る (全国のページは同じ年のどの県の行でもよい)
      const observed = target ?? d.rankingValues[0];
      return {
        metricKey: key,
        title: metricDisplayName(d.rankingItem),
        unit: observed?.unit || d.rankingItem.unit || '',
        yearName: observed?.yearName ?? d.rankingItem.latestYear?.yearName,
        value: selectedPrefectureCode
          ? typeof target?.value === 'number' ? target.value : null
          : nationalValue ?? null,
        rank: selectedPrefectureCode ? (target?.rank ?? null) : null,
        total,
        precision: resolveValuePrecision(
          d.rankingValues.flatMap((v) => (typeof v.value === 'number' ? [v.value] : []))
        ),
        ...source,
        nationalValue,
        series: d.nationalSeries ?? [],
        officialNationalSeries: d.officialNationalSeries,
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
      view: CatalogMetricGroup['view'];
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
              view: undefined,
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
          view: group.view,
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
    : (pageCharts ?? []).filter(
        (c) =>
          !NON_CHART_TYPES.has(c.componentType) &&
          // 全国のページは指標の図を出さない。章の図は全国で 47 県の平均を描くため (公式の全国の推移は指標のカードが描く)
          (selectedPrefectureCode !== null || !PREFECTURE_SERIES_CHART_TYPES.has(c.componentType))
      );
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
    isSingleMetricGroup(panel.metrics);
  /**
   * sectionTitle: 包む章の見出し。切替パネルの見出しが章の見出しと同じ文言なら、
   * 同じ語を 2 段重ねないようパネル側の見出しを省く (章の見出しが region の名前になる)。
   */
  const renderPanel = (panel: Panel, summaryOnly = false, sectionTitle?: string, annotation?: string) => isSingleMetricGroup(panel.metrics) ? (
    <SingleMetricCard
      key={panel.key}
      id={`theme-${themeConfig.themeKey}-panel-${panel.key}`}
      summaryOnly={summaryOnly}
      annotation={annotation}
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
      title={panel.title === sectionTitle ? undefined : panel.title}
      metrics={panel.metrics}
      tabLabels={tabLabels}
      selectedPrefectureCode={selectedPrefectureCode}
      areaName={areaName}
      defaultCheckedKeys={panel.defaultCheckedKeys}
      annotation={annotation}
      seriesColors={panel.view === 'sex' ? sexSeriesColors(panel.metrics) : undefined}
    />
  );
  /**
   * パネル列を「連続するコンパクトカードの run」と「全幅パネル」に分け、順序を保ったまま描く。
   * run は 1 件でも数値タイルの格子 (StatTileGrid) で包む。列の数は格子の部品が本文の幅だけで決める
   * (1 / 2 / 4 列。枚数では変えない。県データブックなど他の数値の並びと同じ規則。2026-10-29)。
   * 同じ行のカードは同じ高さに伸びる。
   */
  const renderPanelRuns = (
    list: Panel[],
    summaryOnlyOf: (panel: Panel) => boolean = () => false,
    sectionTitle?: string,
    annotationOf: (panel: Panel) => string | undefined = () => undefined
  ) => {
    const out: ReactNode[] = [];
    for (let i = 0; i < list.length; ) {
      const panel = list[i];
      if (!isCompact(panel)) {
        out.push(renderPanel(panel, summaryOnlyOf(panel), sectionTitle, annotationOf(panel)));
        i += 1;
        continue;
      }
      let j = i;
      while (j < list.length && isCompact(list[j])) j += 1;
      const run = list.slice(i, j);
      // 1 枚でも数値タイルの格子に入れ、どの章でも 1 マスの幅をそろえる (2026-10-29 オーナー決定「幅を 4 列にそろえる」)
      out.push(
        <div key={`compact-${panel.key}`} data-theme-panel-grid="compact">
          <StatTileGrid>{run.map((item) => renderPanel(item, summaryOnlyOf(item), sectionTitle, annotationOf(item)))}</StatTileGrid>
        </div>
      );
      i = j;
    }
    return out;
  };
  const renderChart = (chart: PageComponent, headingLevel?: 2 | 3) =>
    chart.componentType === 'markdown-section' ? (
      <ThemeDbChartRenderer
        key={chart.componentKey}
        chart={chart}
        prefCode={pageComponentsAreaCode}
        prefName={areaName}
        headingLevel={headingLevel}
      />
    ) : (
    // 見本のチャートのカード (2026-11-01): 見出しの帯に題名と、右端に出典・指標の定義・読むときの注意の Sheet のアイコン。
    // 図の周りに文章を置かない。全国のページで 47 県の平均しか描けない図はカードごと隠す (ThemeDbChartRenderer の印)
    <ChartPanel
      key={chart.componentKey}
      id={`theme-${themeConfig.themeKey}-chart-${chart.componentKey}`}
      title={chart.title}
      className="has-[[data-national-average-hidden]]:hidden"
      action={
        <ChartFooter
          placement="header"
          source={chart.sourceName ?? undefined}
          sourceLink={chart.sourceLink}
          sourceLinks={chartSourceLinks?.[chart.componentKey]}
          annotation={resolveChartAnnotation(chart)}
          rankingLink={chart.rankingLink}
          rankingLabel={primaryRankingLabel(chart.rankingLink, themeConfig.tabIndicators, indicatorDataMap)}
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
    // 章の chartKeys にある考察・FAQ はその章の中で描く (見出しと中身を離さない)
    const chapterMarkdown = markdownComponents.filter(
      (chart) =>
        section.chartKeys?.includes(chart.componentKey) &&
        !usedCharts.has(chart.componentKey)
    );
    chapterPanels.forEach((panel) => usedPanels.add(panel.key));
    chapterCharts.forEach((chart) => usedCharts.add(chart.componentKey));
    chapterMarkdown.forEach((chart) => usedCharts.add(chart.componentKey));
    chapterEmbedded.forEach((key) => usedEmbedded.add(key));
    return {
      ...section,
      panels: chapterPanels,
      charts: chapterCharts,
      markdown: chapterMarkdown,
      embedded: chapterEmbedded,
    };
  });
  // 考察・FAQ だけの章 (読み方章) は比較の節の後ろへ回し、FAQ をページの最後に置く
  // (2026-10-06 に読み方章を末尾へ移した判断と同じ。THEME-READING-CHAPTER-EMPTY-01)
  // 地域の指標を絞った結果、何も描くものが無い章は出さない (見出しだけの章を残さない)
  const isEmpty = (chapter: (typeof chapters)[number]) =>
    chapter.panels.length === 0 &&
    chapter.charts.length === 0 &&
    chapter.markdown.length === 0 &&
    chapter.embedded.length === 0;
  const isTextOnly = (chapter: (typeof chapters)[number]) =>
    chapter.markdown.length > 0 &&
    chapter.panels.length === 0 &&
    chapter.charts.length === 0 &&
    chapter.embedded.length === 0;
  const leadingChapters = chapters.filter((chapter) => !isEmpty(chapter) && !isTextOnly(chapter));
  const trailingChapters = chapters.filter(isTextOnly);
  const remainingMarkdown = markdownComponents.filter(
    (chart) => !usedCharts.has(chart.componentKey)
  );
  const remainingPanels = panels.filter((panel) => !usedPanels.has(panel.key));
  const remainingCharts = chartComponents.filter(
    (chart) => !usedCharts.has(chart.componentKey)
  );
  const remainingEmbedded = Object.keys(embeddedSections).filter(
    (key) => !usedEmbedded.has(key)
  );

  // 県を選んでいるときの県プロフィールへの導線。浮いた 1 行にせず、先頭の節見出しの右端に置く。
  const profileLink = selectedPrefectureCode ? (
    <SectionIndexLink href={hrefFor('area', { areaCode: selectedPrefectureCode })}>
      {areaName}のプロフィール
    </SectionIndexLink>
  ) : null;

  const renderChapter = (
    chapter: (typeof chapters)[number],
    action?: ReactNode
  ) => {
    // 章のチャートがカードと同じ指標だけを描くなら、チャートをやめてカードのグラフを出す (同じ値を 2 か所に出さない)。
    // 1 指標のカードも対象にする (2026-11-01)。注記はカードの出典の Sheet へ引き継ぐ
    // 線 1 本ずつの図が何枚か合わさってカードの指標をちょうど覆う場合も同じ扱いにする (例: 単独世帯と核家族世帯の図 2 枚と、
    // その 2 指標のカード)
    const mergedChartsOf = new Map<string, PageComponent[]>();
    for (const panel of chapter.panels) {
      const keys = panel.metrics.map((metric) => metric.metricKey);
      const whole = chapter.charts.find((chart) => chartDuplicatesMetrics(chart, keys));
      if (whole) {
        mergedChartsOf.set(panel.key, [whole]);
        continue;
      }
      const parts = chapter.charts.filter((chart) => {
        const own = chartOwnMetricKeys(chart);
        return chart.componentType === 'line-chart' && own.length === 1 && keys.includes(own[0]);
      });
      const covered = new Set(parts.flatMap(chartOwnMetricKeys));
      if (keys.length > 1 && keys.every((key) => covered.has(key))) mergedChartsOf.set(panel.key, parts);
    }
    const mergedCharts = new Set([...mergedChartsOf.values()].flat());
    const charts = chapter.charts.filter((chart) => !mergedCharts.has(chart));
    // 内訳の図 (構成比・ドーナツ) が一覧に値と割合を出すので、同じ指標だけのカードは出さない (同じ値を 2 か所に出さない。2026-11-01)
    const breakdownKeySets = charts
      .filter((chart) => BREAKDOWN_CHART_TYPES.has(chart.componentType))
      .map((chart) => new Set(chartOwnMetricKeys(chart)));
    const panels = chapter.panels.filter(
      (panel) =>
        !breakdownKeySets.some(
          (keys) => panel.metrics.length > 0 && panel.metrics.every((metric) => keys.has(metric.metricKey))
        )
    );
    return (
    <PanelGrid
      as="section"
      key={chapter.key}
      id={`theme-section-${chapter.key}`}
      aria-label={chapter.title}
      className="scroll-mt-24"
    >
      {/* 章の説明は見出しの下に文章で置かず、右端のアイコンから開く Sheet に入れる (2026-11-01 オーナー決定) */}
      <SectionHeader
        title={chapter.title}
        action={
          action || chapter.description ? (
            <span className="flex items-center gap-1">
              {action}
              {chapter.description ? (
                <SourcesSheet
                  trigger="icon"
                  label="読むときの注意"
                  groups={[{ notes: [chapter.description], sources: [], rankings: [] }]}
                />
              ) : null}
            </span>
          ) : undefined
        }
      />
      {renderPanelRuns(panels, (panel) => {
        if (mergedChartsOf.has(panel.key)) return false;
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
      }, chapter.title, (panel) => {
        const notes = (mergedChartsOf.get(panel.key) ?? [])
          .map((chart) => resolveChartAnnotation(chart))
          .filter((note): note is string => Boolean(note));
        return notes.length > 0 ? notes.join(' ') : undefined;
      })}
      {charts.length > 0 && (
        <PanelGrid className={`grid-cols-1 ${charts.length > 1 ? "@md:grid-cols-2" : ""}`}>
          {charts.map((chart) =>
            renderChart(chart)
          )}
        </PanelGrid>
      )}
      {chapter.markdown.length > 0 && (
        <PanelGrid>
          {chapter.markdown.map((chart) => renderChart(chart, 3))}
        </PanelGrid>
      )}
      {chapter.embedded.map((key) => (
        <div key={key}>{embeddedSections[key]}</div>
      ))}
    </PanelGrid>
    );
  };

  return (
    <PanelGrid
      as="section"
      id="theme-indicators"
      // 章・パネル・文章を 1 本の線の格子に並べる (ページの本文の列につながる)
      className="@container scroll-mt-24"
    >
      <h2 className="sr-only">{areaName}の主要指標</h2>
      {/* 節見出しが無いテーマでは、見出しの右端に置けないので最初の行の右端に置く */}
      {profileLink && leadingChapters.length === 0 && (
        <div className="flex justify-end">{profileLink}</div>
      )}
      {leadingChapters.map((chapter, index) =>
        renderChapter(chapter, index === 0 ? profileLink : undefined)
      )}
      {renderPanelRuns(remainingPanels)}
      {remainingCharts.length > 0 && (
        <PanelGrid
          id="theme-charts"
          className={`scroll-mt-24 grid-cols-1 ${remainingCharts.length > 1 ? '@md:grid-cols-2' : ''}`}
        >
          {remainingCharts.map((chart) => renderChart(chart))}
        </PanelGrid>
      )}
      {remainingEmbedded.map((key) => (
        <div key={key}>{embeddedSections[key]}</div>
      ))}
      {trailingChapters.map((chapter) => renderChapter(chapter))}
      {remainingMarkdown.length > 0 && (
        <PanelGrid>
          {remainingMarkdown.map((chart) => renderChart(chart))}
        </PanelGrid>
      )}
    </PanelGrid>
  );
}

/** 全国の図を描く章の図の種類 (指標の系列を県ごとに読む図)。全国のページでは 47 県の平均になるので出さない */
const PREFECTURE_SERIES_CHART_TYPES = new Set(['line-chart', 'mixed-chart', 'composition-chart', 'donut-chart']);

/** 一覧に値と割合を出す内訳の図の種類 (共通の BreakdownDonut で描く) */
const BREAKDOWN_CHART_TYPES = new Set(['composition-chart', 'donut-chart']);

/** 公式の全国の値か推移を持つ指標か (全国のページに出す指標) */
function hasOfficialNational(data: ThemeIndicatorData): boolean {
  return data.nationalValue !== undefined || (data.officialNationalSeries?.length ?? 0) > 0;
}

/** 男女の比較のカード ([男, 女]) の系列色。色の意味はチャートの色の役割 (chart-color-role) にそろえる */
function sexSeriesColors(metrics: readonly MetricKpi[]): Record<string, string> {
  const [male, female] = metrics;
  return {
    ...(male ? { [male.metricKey]: resolveChartColorHex('male') } : {}),
    ...(female ? { [female.metricKey]: resolveChartColorHex('female') } : {}),
  };
}

/**
 * 章のチャートが、カードの指標と同じ指標だけを描いているか (折れ線・全国の系列なし・指標の集合が一致。1 指標のカードも含む)。
 * 一致するなら同じグラフが 2 つになるので、章のチャートをやめてカードのグラフ (系列を選べる) を出す。
 */
/** 章の図が描く指標 (全国の系列を除く) */
function chartOwnMetricKeys(chart: PageComponent): string[] {
  return ['seriesRefs', 'columnSeriesRefs', 'lineSeriesRefs'].flatMap((field) => {
    const value = chart.componentProps[field];
    return Array.isArray(value)
      ? value.flatMap((ref) =>
          ref && typeof ref === 'object' && typeof ref.metricKey === 'string' && ref.area !== 'national' ? [ref.metricKey as string] : []
        )
      : [];
  });
}

export function chartDuplicatesMetrics(chart: PageComponent, metricKeys: readonly string[]): boolean {
  if (chart.componentType !== 'line-chart') return false;
  const refs = ['seriesRefs', 'columnSeriesRefs', 'lineSeriesRefs'].flatMap((field) => {
    const value = chart.componentProps[field];
    return Array.isArray(value) ? value : [];
  });
  if (refs.length !== metricKeys.length || metricKeys.length < 1) return false;
  if (refs.some((ref) => !ref || typeof ref !== 'object' || ref.area === 'national')) return false;
  const chartKeys = new Set(refs.map((ref) => ref.metricKey));
  return chartKeys.size === metricKeys.length && metricKeys.every((key) => chartKeys.has(key));
}
