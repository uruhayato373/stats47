"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { TrendingUp, MapPin, ArrowDownUp } from "lucide-react";

import { ChartPanel } from "@/components/charts/ChartPanel";
import { RankingBarList } from "@/components/charts/RankingBarList";
import type { LineChartData } from "@/components/stat-charts/types/visualization";

import { fetchMetricTimeseriesAction, type MetricTimeseriesPoint } from "../actions";

import { ChartEmptyState, ChartLoading } from "./ChartState";

import type { RankingItem, RankingValue } from "@stats47/ranking";

const LineChartClient = dynamic(
  () => import("@/components/stat-charts/components/charts/LineChart/LineChartClient").then((mod) => mod.LineChartClient),
  { ssr: false, loading: () => <ChartLoading height={250} /> },
);

interface Props {
  /** 選択中の metric (rankingKey) */
  metricKey: string;
  /** 選択中の都道府県 code (null = 47都道府県・未選択。e-Stat の '00000' ではない) */
  selectedPrefectureCode: string | null;
  /** 選択 metric の RankingItem (タイトル・単位) */
  rankingItem: RankingItem | undefined;
  /** 選択 metric の現在年度ランキング値 (上下位 bar 用) */
  currentValues: RankingValue[];
}

/**
 * 選択中の metric に対する 個別チャート群:
 *  - (A) 時系列 line: 選択都道府県の推移 (未選択時は fetch せず選択案内を出す)
 *  - (B) 上下位 5 県 bar: 現在年度のランキング極値 (未選択時も常に表示。ranking を主役にする)
 *
 * ★GEO-SCOPE-SEPARATION-01 WP2: 47都道府県 (未選択) では「全国」の時系列を代わりに
 * 見せない。県を選ぶまでは (B) の上下位ランキングだけが情報源になる。
 *
 * Phase 3 で pie / breakdown を追加予定。
 */
export function MetricFocusCharts({
  metricKey,
  selectedPrefectureCode,
  rankingItem,
  currentValues,
}: Props) {
  const [timeseries, setTimeseries] = useState<MetricTimeseriesPoint[]>([]);
  const [isPending, startTransition] = useTransition();

  const areaName = useMemo(() => {
    if (!selectedPrefectureCode) return null;
    return lookupArea(selectedPrefectureCode)?.areaName ?? "選択地域";
  }, [selectedPrefectureCode]);

  useEffect(() => {
    if (!metricKey || !selectedPrefectureCode) {
      setTimeseries([]);
      return;
    }
    let cancelled = false;
    startTransition(async () => {
      const { points } = await fetchMetricTimeseriesAction(
        metricKey,
        selectedPrefectureCode,
      );
      if (!cancelled) setTimeseries(points);
    });
    return () => {
      cancelled = true;
    };
  }, [metricKey, selectedPrefectureCode]);

  // LineChartData に変換
  const lineChartData: LineChartData | null = useMemo(() => {
    if (timeseries.length === 0) return null;
    return {
      xAxisKey: "year",
      data: timeseries.map((p) => ({
        year: p.yearName,
        value: p.value,
      })),
      lines: [
        {
          dataKey: "value",
          name: `${areaName}の${rankingItem?.title ?? "値"}`,
          color: "hsl(var(--primary))",
        },
      ],
      unit: rankingItem?.unit ?? "",
    };
  }, [timeseries, areaName, rankingItem]);

  // 上下位 5 県 bar 用データ
  const { topFive, bottomFive } = useMemo(() => {
    const valid = currentValues
      .filter((v) => typeof v.value === "number" && Number.isFinite(v.value))
      .slice()
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return {
      topFive: valid.slice(0, 5),
      bottomFive: valid.slice(-5).reverse(),
    };
  }, [currentValues]);

  const maxAbsValue = useMemo(() => {
    const all = [...topFive, ...bottomFive];
    return Math.max(...all.map((v) => Math.abs(v.value ?? 0)), 1);
  }, [topFive, bottomFive]);

  if (!rankingItem) return null;

  return (
    <ChartPanel
      title={`${rankingItem.title} — 詳細チャート`}
      icon={<TrendingUp className="h-4 w-4 shrink-0 text-primary" />}
      titleClassName="text-base"
      className="rounded-lg"
      contentClassName="space-y-5"
      action={
        <Link
          href={`/ranking/${metricKey}`}
          className="text-xs text-primary hover:underline"
        >
          指標の詳細 →
        </Link>
      }
      description={
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {areaName ? (
            <span>{areaName} の時系列推移</span>
          ) : (
            <span>地図で都道府県を選択すると、その県の時系列推移が表示されます</span>
          )}
        </div>
      }
    >
      {/* (A) 時系列ライン (47都道府県・未選択のときは fetch せず案内を出す) */}
      <section>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> 時系列推移
        </h3>
        {!selectedPrefectureCode ? (
          <ChartEmptyState
            message="都道府県を選択すると、その県の推移が表示されます"
            height={120}
          />
        ) : isPending ? (
          <ChartLoading height={250} />
        ) : lineChartData ? (
          <LineChartClient chartData={lineChartData} />
        ) : (
          <ChartEmptyState message="時系列データがありません" height={120} />
        )}
      </section>

      {/* (B) 上下位 5 県 bar */}
      <section>
        <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <ArrowDownUp className="h-3 w-3" /> 上位 5 / 下位 5
        </h3>
        <div className="space-y-1.5">
          <RankingBarList
            items={topFive.map((v) => ({
              key: `top-${v.areaCode}`,
              areaCode: v.areaCode,
              value: v.value ?? 0,
              rank: v.rank,
              tone: "top",
              highlighted: v.areaCode === selectedPrefectureCode,
            }))}
            max={maxAbsValue}
            unit={rankingItem.unit ?? ""}
            showRank
          />
          <div className="border-t border-dashed border-border my-1.5" />
          <RankingBarList
            items={bottomFive.map((v) => ({
              key: `bottom-${v.areaCode}`,
              areaCode: v.areaCode,
              value: v.value ?? 0,
              rank: v.rank,
              tone: "bottom",
              highlighted: v.areaCode === selectedPrefectureCode,
            }))}
            max={maxAbsValue}
            unit={rankingItem.unit ?? ""}
            showRank
          />
        </div>
      </section>
    </ChartPanel>
  );
}
