"use client";

import { useMemo } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { ArrowRight } from "lucide-react";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";
import type { PageComponent } from "@/components/stat-charts";

import { MetricSwitcherPanel } from "./MetricSwitcherPanel";
import { ThemeDbChartRenderer } from "./ThemeDbChartRenderer";

import type { MetricKpi } from "./metric-kpi";
import type { ThemeConfig, ThemeIndicatorData } from "../types";
import type { CatalogMetricGroup } from "@stats47/data-configs/theme-catalog";

interface Props {
  /** テーマ設定 */
  themeConfig: ThemeConfig;
  /**
   * 指標カードの編成 (ThemeCatalog.metricGroups)。未定義なら
   * 「非 context 指標を 1 グループ」にフォールバックする。
   */
  metricGroups?: CatalogMetricGroup[];
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** DB 管理チャート（page_components） */
  pageCharts?: PageComponent[];
  /** 選択中の都道府県コード（null = 全国） */
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
const NON_CHART_TYPES = new Set(["kpi-card", "markdown-section"]);

/**
 * テーマページのフル幅ダッシュボード
 *
 * /areas/[code]/[category] と同様のスタイルで、テーマの主要指標を
 * 「KPI カード + 時系列チャート + 考察」として一画面に集約する。
 *
 * - KPI カード: tabIndicators（role≠context の指標）を indicatorDataMap から導出。
 *   都道府県選択時はその県の値・全国順位、未選択時は全都道府県から算出した代表値を表示。
 * - 時系列チャート: page_components の line/mixed/composition 等を ThemeDbChartRenderer で描画。
 *   従来 PrefectureStatsPanel は kpi-card 不在のため section 付きチャートを描画できず、
 *   全テーマで埋め草になっていた（本コンポーネントが置き換える）。
 * - markdown-section: 考察テキストを末尾にフル幅で描画。
 *
 * prefCode="00000"（全国）でも各 Server Action はデータを返すため、
 * 都道府県未選択時は全国トレンドが表示される。
 */
export function ThemeMetricsDashboard({
  themeConfig,
  metricGroups,
  indicatorDataMap,
  pageCharts,
  selectedPrefectureCode,
  cardsOnly,
}: Props) {
  const areaName = selectedPrefectureCode
    ? lookupArea(selectedPrefectureCode)?.areaName ?? "選択地域"
    : "全国";
  const areaCode = selectedPrefectureCode ?? "00000";

  const kpiKeys = useMemo(
    () =>
      themeConfig.tabIndicators
        .map((t) => t.rankingKey)
        .filter(
          (k) =>
            indicatorDataMap[k] &&
            indicatorDataMap[k].rankingValues.length >= MIN_VALUES_FOR_KPI,
        ),
    [themeConfig.tabIndicators, indicatorDataMap],
  );

  const kpis = useMemo<MetricKpi[]>(() => {
    const keys = kpiKeys;

    return keys.map((key) => {
      const d = indicatorDataMap[key];
      const values = d.rankingValues
        .map((v) => v.value)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const total = d.rankingValues.length;
      const nationalAverage =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null;

      const isNational = !selectedPrefectureCode;
      const target = selectedPrefectureCode
        ? d.rankingValues.find((v) => v.areaCode === selectedPrefectureCode)
        : undefined;

      if (!isNational) {
        return {
          metricKey: key,
          title: d.rankingItem.title,
          unit: d.rankingItem.unit ?? "",
          value: typeof target?.value === "number" ? target.value : null,
          rank: target?.rank ?? null,
          total,
          series: d.nationalSeries ?? [],
          isNationalAverage: false,
          isLoading: false,
        };
      }

      // 全国表示: タイルは R2 由来の 47 県平均を即座に出す (「平均」と明示する)。
      // 真の全国値は MetricSwitcherPanel が選択中の 1 指標だけを取りに行き、
      // チャートの凡例で「全国」/「全国平均」を出し分ける。ここで全指標ぶんを
      // 先読みすると初期表示が遅くなるだけなので取りに行かない。
      return {
        metricKey: key,
        title: d.rankingItem.title,
        unit: d.rankingItem.unit ?? "",
        value: d.nationalValue ?? nationalAverage,
        rank: null,
        total,
        series: d.nationalSeries ?? [],
        isNationalAverage: true,
        isLoading: false,
      };
    });
  }, [kpiKeys, indicatorDataMap, selectedPrefectureCode]);

  const tabLabels = useMemo(
    () =>
      Object.fromEntries(
        themeConfig.tabIndicators.map((t) => [t.rankingKey, t.tabLabel]),
      ),
    [themeConfig.tabIndicators],
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
   */
  const panels = useMemo(() => {
    if (!metricGroups || metricGroups.length === 0) {
      return kpis.length > 0
        ? [
            {
              key: "default",
              // 見出しは section の h2 が既に言っているので重ねない。
              // パネル側が代表指標のタイトルに倒す (= 従来の 1 パネル構成と同じ)
              title: undefined as string | undefined,
              metrics: kpis,
              defaultCheckedKeys: [themeConfig.defaultRankingKey],
            },
          ]
        : [];
    }
    const byKey = new Map(kpis.map((k) => [k.metricKey, k]));
    return metricGroups
      .map((group) => {
        const groupMetrics = group.rankingKeys
          .map((key) => byKey.get(key))
          .filter((m): m is MetricKpi => m !== undefined);
        const alive = new Set(groupMetrics.map((m) => m.metricKey));
        return {
          key: group.key,
          title: group.title as string | undefined,
          metrics: groupMetrics,
          defaultCheckedKeys: group.defaultCheckedKeys.filter((k) =>
            alive.has(k),
          ),
        };
      })
      .filter((panel) => panel.metrics.length > 0);
  }, [metricGroups, kpis, themeConfig.defaultRankingKey]);

  // cardsOnly: KPI スタットカードのみ。チャート・考察は描画しない
  const chartComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => !NON_CHART_TYPES.has(c.componentType));
  const markdownComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => c.componentType === "markdown-section");

  if (
    panels.length === 0 &&
    chartComponents.length === 0 &&
    markdownComponents.length === 0
  ) {
    return null;
  }

  return (
    <section className="@container space-y-4">
      {/* KPI カード（areas スタイル） */}
      {kpis.length > 0 && (
        <div>
          <h2 className="sr-only">{areaName}の主要指標</h2>
          {selectedPrefectureCode && (
            <div className="mb-2 flex justify-end">
              <Link
                href={`/areas/${selectedPrefectureCode}`}
                className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
              >
                {areaName}のプロフィール <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
          {/* 指標カード。タイルのチェックで系列を重ね、下の 1 枚に描く。
              カードとチャートで同じ事実を二度描かない構成 (2026-08-05 に全テーマ展開。
              旧 ChartCard グリッドはミニチャートと下段チャートが重複していたので廃止)。
              グループ定義があれば 1 グループ = 1 枚で並べる (2026-08-06)。 */}
          <div className="space-y-4">
            {panels.map((panel) => (
              <MetricSwitcherPanel
                key={panel.key}
                title={panel.title}
                metrics={panel.metrics}
                tabLabels={tabLabels}
                selectedPrefectureCode={selectedPrefectureCode}
                areaName={areaName}
                defaultCheckedKeys={panel.defaultCheckedKeys}
              />
            ))}
          </div>
        </div>
      )}

      {/* 時系列チャート */}
      {chartComponents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
          {chartComponents.map((chart) => (
            <ChartPanel
              key={chart.componentKey}
              title={chart.title}
              footer={
                <ChartFooter
                  source={chart.sourceName ?? undefined}
                  sourceLink={chart.sourceLink}
                  rankingLink={chart.rankingLink}
                  rankingLabel="ランキングを見る"
                />
              }
            >
              <ThemeDbChartRenderer
                chart={chart}
                prefCode={areaCode}
                prefName={areaName}
              />
            </ChartPanel>
          ))}
        </div>
      )}

      {/* 考察（markdown-section） */}
      {markdownComponents.map((chart) => (
        <ThemeDbChartRenderer
          key={chart.componentKey}
          chart={chart}
          prefCode={areaCode}
          prefName={areaName}
        />
      ))}
    </section>
  );
}
