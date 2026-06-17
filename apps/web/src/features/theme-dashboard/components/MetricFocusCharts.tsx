"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";

import { lookupArea } from "@stats47/area";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { TrendingUp, MapPin, ArrowDownUp } from "lucide-react";

import { LineChartClient } from "@/components/stat-charts/components/charts/LineChart/LineChartClient";
import type { LineChartData } from "@/components/stat-charts/types/visualization";

import { fetchMetricTimeseriesAction, type MetricTimeseriesPoint } from "../actions";

import type { RankingItem, RankingValue } from "@stats47/ranking";

interface Props {
  /** 選択中の metric (rankingKey) */
  metricKey: string;
  /** 選択中の都道府県 code (null なら全国 '00000') */
  selectedPrefectureCode: string | null;
  /** 選択 metric の RankingItem (タイトル・単位) */
  rankingItem: RankingItem | undefined;
  /** 選択 metric の現在年度ランキング値 (上下位 bar 用) */
  currentValues: RankingValue[];
}

/**
 * 選択中の metric に対する 個別チャート群:
 *  - (A) 時系列 line: 全国 or 選択都道府県の推移
 *  - (B) 上下位 5 県 bar: 現在年度のランキング極値
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

  const areaCode = selectedPrefectureCode ?? "00000";
  const areaName = useMemo(() => {
    if (!selectedPrefectureCode) return "全国";
    return lookupArea(selectedPrefectureCode)?.areaName ?? "選択地域";
  }, [selectedPrefectureCode]);

  useEffect(() => {
    if (!metricKey) return;
    let cancelled = false;
    startTransition(async () => {
      const data = await fetchMetricTimeseriesAction(metricKey, areaCode);
      if (!cancelled) setTimeseries(data);
    });
    return () => {
      cancelled = true;
    };
  }, [metricKey, areaCode]);

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
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">
              {rankingItem.title} — 詳細チャート
            </CardTitle>
          </div>
          <Link
            href={`/ranking/${metricKey}`}
            className="text-xs text-primary hover:underline"
          >
            指標の詳細 →
          </Link>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{areaName} の時系列推移</span>
          {!selectedPrefectureCode && (
            <span className="ml-1">(地図で都道府県を選択すると切り替わります)</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* (A) 時系列ライン */}
        <section>
          <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> 時系列推移
          </h3>
          {isPending ? (
            <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground animate-pulse">
              読込中...
            </div>
          ) : lineChartData ? (
            <LineChartClient chartData={lineChartData} />
          ) : (
            <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
              時系列データがありません
            </div>
          )}
        </section>

        {/* (B) 上下位 5 県 bar */}
        <section>
          <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <ArrowDownUp className="h-3 w-3" /> 上位 5 / 下位 5
          </h3>
          <div className="space-y-1">
            {topFive.map((v) => (
              <TopBottomRow
                key={`top-${v.areaCode}`}
                areaCode={v.areaCode}
                value={v.value ?? 0}
                rank={v.rank ?? 0}
                max={maxAbsValue}
                unit={rankingItem.unit ?? ""}
                tone="top"
                highlighted={v.areaCode === selectedPrefectureCode}
              />
            ))}
            <div className="border-t border-dashed border-border my-1.5" />
            {bottomFive.map((v) => (
              <TopBottomRow
                key={`bot-${v.areaCode}`}
                areaCode={v.areaCode}
                value={v.value ?? 0}
                rank={v.rank ?? 0}
                max={maxAbsValue}
                unit={rankingItem.unit ?? ""}
                tone="bottom"
                highlighted={v.areaCode === selectedPrefectureCode}
              />
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function TopBottomRow({
  areaCode,
  value,
  rank,
  max,
  unit,
  tone,
  highlighted,
}: {
  areaCode: string;
  value: number;
  rank: number;
  max: number;
  unit: string;
  tone: "top" | "bottom";
  highlighted?: boolean;
}) {
  const areaName = lookupArea(areaCode)?.areaName ?? areaCode;
  const widthPercent = Math.min(100, (Math.abs(value) / max) * 100);
  const color = tone === "top" ? "bg-blue-500" : "bg-slate-400";
  return (
    <div className={`flex items-center gap-2 text-xs ${highlighted ? "font-semibold" : ""}`}>
      <span className="w-6 text-right text-muted-foreground tabular-nums">{rank}</span>
      <span className="w-14 truncate">{areaName}</span>
      <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${widthPercent}%` }} />
      </div>
      <span className="w-20 text-right tabular-nums">
        {value.toLocaleString()}
        <span className="ml-0.5 text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}
