"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { ArrowRight, MapPin } from "lucide-react";

import { ChartCard } from "@/components/charts/ChartCard";
import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { MiniLineChart } from "@/components/charts/MiniCharts";
import type { PageComponent } from "@/components/stat-charts";

import {
  fetchMetricTimeseriesAction,
  type MetricTimeseriesResult,
} from "../actions";

import { ChartEmptyState, ChartLoading } from "./ChartState";
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
  /** 都道府県選択時はその県の値、未選択時は全国値（取得できなければ 47 県平均） */
  value: number | null;
  rank: number | null;
  total: number;
  /** 年次推移（MiniLineChart 用） */
  series: { year: number; value: number }[];
  /**
   * 全国表示で値・系列が 47 県の単純平均のとき true。
   * 総人口のような実数系は全国値の 1/47 になるため「全国」と称してはならない。
   */
  isNationalAverage: boolean;
  /** 全国値をまだ取得中 */
  isLoading: boolean;
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

  /**
   * 全国表示のときだけ e-Stat の全国行 (00000) を取りに行く。
   *
   * ★R2 の ranking values は全国行を持たない (取り込み時に除外される) ため、
   *   preload された値だけでは 47 県平均しか作れない。真の全国値は e-Stat 側にあり、
   *   fetchMetricTimeseriesAction が「全国行があればそれ・無ければ平均」を申告付きで返す。
   *   RSC 描画中の e-Stat 取得は Workers で失敗した実績があるので client から server action を叩く
   *   (MetricFocusCharts と同じ経路)。
   */
  // 取得結果に「どの要求に対する結果か」を持たせ、描画時に照合する。
  // effect 内で同期的に state を捨てないので、県切替時の古い結果もそのまま無視できる。
  const nationalRequestId = selectedPrefectureCode ? "" : kpiKeys.join(",");
  const [nationalFetch, setNationalFetch] = useState<{
    requestId: string;
    byKey: Record<string, MetricTimeseriesResult>;
  } | null>(null);

  useEffect(() => {
    if (selectedPrefectureCode || kpiKeys.length === 0) return;
    let cancelled = false;
    void Promise.all(
      kpiKeys.map(async (key) => {
        const result = await fetchMetricTimeseriesAction(key, "00000").catch(
          () => null,
        );
        return [key, result] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      const byKey: Record<string, MetricTimeseriesResult> = {};
      for (const [key, result] of entries) {
        if (result) byKey[key] = result;
      }
      setNationalFetch({ requestId: nationalRequestId, byKey });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPrefectureCode, kpiKeys, nationalRequestId]);

  /** 現在の要求に対応する結果のみ採用する (未取得・古い結果は null = ローディング) */
  const nationalByKey =
    nationalFetch?.requestId === nationalRequestId ? nationalFetch.byKey : null;

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

      // 全国表示: e-Stat の全国行が取れていればそれを使い、取れなければ 47 県平均と明示する
      const national = nationalByKey?.[key];
      const useNational = national?.source === "national" && national.points.length > 0;
      const nationalSeries = useNational
        ? national.points.map((p) => ({ year: Number(p.year.slice(0, 4)), value: p.value }))
        : null;

      return {
        metricKey: key,
        title: d.rankingItem.title,
        unit: d.rankingItem.unit ?? "",
        value: useNational
          ? national.points[national.points.length - 1].value
          : (d.nationalValue ?? nationalAverage),
        rank: null,
        total,
        series: nationalSeries ?? d.nationalSeries ?? [],
        isNationalAverage: !useNational,
        isLoading: nationalByKey === null,
      };
    });
  }, [kpiKeys, indicatorDataMap, selectedPrefectureCode, nationalByKey]);

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
                // 47 県平均を「全国」と誤読させないため、平均のときだけラベルに明示する
                label={k.isNationalAverage && !k.isLoading ? `${k.title}（全国平均）` : k.title}
                value={
                  k.isLoading
                    ? "…"
                    : k.value !== null
                      ? `${k.value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}${k.unit ? ` ${k.unit}` : ""}`
                      : "—"
                }
                chart={
                  k.isLoading ? (
                    <ChartLoading height={84} />
                  ) : k.series.length >= 2 ? (
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
