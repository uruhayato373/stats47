"use client";

import { useMemo } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { ArrowRight, MapPin } from "lucide-react";

import { ChartPanel } from "@/components/charts/ChartPanel";
import { MiniLineChart } from "@/components/charts/MiniCharts";
import { ChartCard } from "@/components/charts/StatsChartCard";
import type { PageComponent } from "@/components/stat-charts";

import { ChartEmptyState } from "./ChartState";
import { ThemeDbChartRenderer } from "./ThemeDbChartRenderer";

import type { ThemeConfig, ThemeIndicatorData } from "../types";

interface Props {
  /** テーマ設定 */
  themeConfig: ThemeConfig;
  /** 全指標のプリロード済みデータ（rankingKey → data） */
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** DB 管理チャート（page_components） */
  pageCharts?: PageComponent[];
  /** 選択中の都道府県コード（null = 全国） */
  selectedPrefectureCode: string | null;
  /**
   * 地図なしレイアウト時に true を渡す。
   * 県未選択時の「地図で都道府県を選択すると…」ヒントを非表示にする。
   */
  mapless?: boolean;
  /**
   * true のとき KPI スタットカードのみ描画し、時系列チャート・考察
   * (markdown-section) を出さない。hideMap のカードのみビュー用。
   */
  cardsOnly?: boolean;
}

interface MetricKpi {
  metricKey: string;
  title: string;
  unit: string;
  /** 都道府県選択時はその県の値、未選択時は全都道府県から算出した代表値 */
  value: number | null;
  rank: number | null;
  total: number;
  /** 全国行の年次推移（MiniLineChart 用） */
  series: { year: number; value: number }[];
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
  indicatorDataMap,
  pageCharts,
  selectedPrefectureCode,
  mapless,
  cardsOnly,
}: Props) {
  const areaName = selectedPrefectureCode
    ? lookupArea(selectedPrefectureCode)?.areaName ?? "選択地域"
    : "全国";
  const areaCode = selectedPrefectureCode ?? "00000";

  const kpis = useMemo<MetricKpi[]>(() => {
    const keys = themeConfig.tabIndicators
      .map((t) => t.rankingKey)
      .filter(
        (k) =>
          indicatorDataMap[k] &&
          indicatorDataMap[k].rankingValues.length >= MIN_VALUES_FOR_KPI,
      );

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
      const value = isNational
        ? (d.nationalValue ?? nationalAverage)
        : typeof target?.value === "number"
          ? target.value
          : null;
      const rank = isNational ? null : (target?.rank ?? null);

      return {
        metricKey: key,
        title: d.rankingItem.title,
        unit: d.rankingItem.unit ?? "",
        value,
        rank,
        total,
        series: d.nationalSeries ?? [],
      };
    });
  }, [themeConfig.tabIndicators, indicatorDataMap, selectedPrefectureCode]);

  // cardsOnly: KPI スタットカードのみ。チャート・考察は描画しない
  const chartComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => !NON_CHART_TYPES.has(c.componentType));
  const markdownComponents = cardsOnly
    ? []
    : (pageCharts ?? []).filter((c) => c.componentType === "markdown-section");

  if (
    kpis.length === 0 &&
    chartComponents.length === 0 &&
    markdownComponents.length === 0
  ) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* KPI カード（areas スタイル） */}
      {kpis.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold">{areaName}の主要指標</h2>
            </div>
            {selectedPrefectureCode ? (
              <Link
                href={`/areas/${selectedPrefectureCode}`}
                className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
              >
                {areaName}のプロフィール <ArrowRight className="h-3 w-3" />
              </Link>
            ) : mapless ? null : (
              <span className="text-xs text-muted-foreground">
                地図で都道府県を選択すると順位を表示
              </span>
            )}
          </div>
          {/* チャート付き stats-card のみ: 各指標を 1 枚の ChartCard(値 + 全国トレンド) で表示。
             データのみ KPI カード・上位県バー・大トレンドの重複は廃止 (2026-06-20)。 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((k) => (
              <ChartCard
                key={k.metricKey}
                label={k.title}
                value={
                  k.value !== null
                    ? `${k.value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}${k.unit ? ` ${k.unit}` : ""}`
                    : "—"
                }
                chart={
                  k.series.length >= 2 ? (
                    <MiniLineChart
                      points={k.series}
                      unit={k.unit}
                      seriesName={k.title}
                    />
                  ) : (
                    <ChartEmptyState message="推移データなし" height={84} />
                  )
                }
                footer={
                  <Link
                    href={`/ranking/${k.metricKey}`}
                    className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                  >
                    ランキングを見る <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* 時系列チャート */}
      {chartComponents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {chartComponents.map((chart) => (
            <ChartPanel key={chart.componentKey} title={chart.title}>
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
