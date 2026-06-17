"use client";

import { useMemo } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ArrowRight, BarChart3, MapPin } from "lucide-react";

import type { PageComponent } from "@/components/stat-charts";

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
}

interface MetricKpi {
  metricKey: string;
  title: string;
  unit: string;
  /** 都道府県選択時はその県の値、未選択時は全国平均 */
  value: number | null;
  rank: number | null;
  total: number;
  diffFromAvgPct: number | null;
  isNational: boolean;
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
 *   都道府県選択時はその県の値・全国順位・全国平均比、未選択時は全国平均を表示。
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
        ? nationalAverage
        : typeof target?.value === "number"
          ? target.value
          : null;
      const rank = isNational ? null : (target?.rank ?? null);
      const diffFromAvgPct =
        !isNational &&
        value !== null &&
        nationalAverage !== null &&
        nationalAverage !== 0
          ? ((value - nationalAverage) / nationalAverage) * 100
          : null;

      return {
        metricKey: key,
        title: d.rankingItem.title,
        unit: d.rankingItem.unit ?? "",
        value,
        rank,
        total,
        diffFromAvgPct,
        isNational,
      };
    });
  }, [themeConfig.tabIndicators, indicatorDataMap, selectedPrefectureCode]);

  const chartComponents = (pageCharts ?? []).filter(
    (c) => !NON_CHART_TYPES.has(c.componentType),
  );
  const markdownComponents = (pageCharts ?? []).filter(
    (c) => c.componentType === "markdown-section",
  );

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
            ) : (
              <span className="text-xs text-muted-foreground">
                地図で都道府県を選択すると順位・全国平均比を表示
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <KpiTile key={k.metricKey} data={k} />
            ))}
          </div>
        </div>
      )}

      {/* 時系列チャート */}
      {chartComponents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {chartComponents.map((chart) => (
            <Card
              key={chart.componentKey}
              className="border border-border shadow-sm"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeDbChartRenderer
                  chart={chart}
                  prefCode={areaCode}
                  prefName={areaName}
                />
              </CardContent>
            </Card>
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

function KpiTile({ data }: { data: MetricKpi }) {
  const { metricKey, title, unit, value, rank, total, diffFromAvgPct, isNational } =
    data;
  const isTopHalf = rank !== null && rank <= Math.ceil(total / 2);
  const rankBadgeColor = !rank
    ? "bg-muted text-muted-foreground"
    : rank <= 5
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
      : rank >= total - 4
        ? "bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
        : "bg-muted text-foreground";

  return (
    <Link
      href={`/ranking/${metricKey}`}
      className="block rounded-md border border-border p-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="mb-1.5 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
        {title}
      </div>
      <div className="mb-1.5 flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums">
          {value !== null
            ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : "—"}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      <div className="flex items-center justify-between gap-1 text-[11px]">
        {isNational ? (
          <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            全国平均
          </span>
        ) : (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 ${rankBadgeColor}`}
          >
            <BarChart3 className="mr-0.5 h-2.5 w-2.5" />
            {rank !== null ? `${rank} / ${total} 位` : "順位なし"}
          </span>
        )}
        {diffFromAvgPct !== null && (
          <span
            className={`tabular-nums ${
              isTopHalf ? "text-blue-600 dark:text-blue-300" : "text-slate-500"
            }`}
          >
            全国平均比 {diffFromAvgPct >= 0 ? "+" : ""}
            {diffFromAvgPct.toFixed(1)}%
          </span>
        )}
      </div>
    </Link>
  );
}
