"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

import { RankingRankBadge } from "../../../ranking/components/RankingHighlights/RankingRankBadge";
import { useChartData } from "../../hooks/useChartData";

import type { BaseChartConfig } from "../../types/chart-config.types";
import type { ChartDataNode } from "@stats47/visualization/d3";

interface StatsHighlightConfig extends BaseChartConfig {
  displayUnit?: string;
  valueLabel?: string;
}

type RankedItem = {
  rank: number;
  name: string;
  value: number;
  displayValue: string;
};

type Stats = {
  mean: string;
  median: string;
  max: { value: string; name: string };
  min: { value: string; name: string };
  total: string;
  count: number;
};

function formatOku(value: number): string {
  return Math.round(value / 100000).toLocaleString("ja-JP");
}

function formatRaw(value: number): string {
  return value.toLocaleString("ja-JP");
}

export function BlogStatsHighlight(props: StatsHighlightConfig) {
  const { data, isLoading } = useChartData<ChartDataNode[]>(props.dataPath);

  const fmt = props.displayUnit === "億円" ? formatOku : formatRaw;

  const top3 = useMemo<RankedItem[]>(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return sorted.slice(0, 3).map((item, i) => ({
      rank: i + 1,
      name: item.name,
      value: item.value,
      displayValue: fmt(item.value),
    }));
  }, [data, fmt]);

  const stats = useMemo<Stats | null>(() => {
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const values = sorted.map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const mid = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
    return {
      mean: fmt(mean),
      median: fmt(median),
      max: { value: fmt(sorted[0].value), name: sorted[0].name },
      min: {
        value: fmt(sorted[sorted.length - 1].value),
        name: sorted[sorted.length - 1].name,
      },
      total: fmt(sum),
      count: values.length,
    };
  }, [data, fmt]);

  const unit = props.displayUnit ?? "";

  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border shadow-sm rounded-sm h-32 animate-pulse" />
        <Card className="border border-border shadow-sm rounded-sm h-32 animate-pulse" />
      </div>
    );
  }

  if (!data || top3.length === 0 || !stats) return null;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top 3 */}
      <Card className="border border-border shadow-sm rounded-sm h-full">
        <CardHeader>
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle>Top 3 都道府県</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {top3.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <RankingRankBadge rank={item.rank} />
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">
                    {item.displayValue}
                  </span>
                  {unit && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card className="border border-border shadow-sm rounded-sm h-full">
        <CardHeader>
          <BarChart3 className="h-4 w-4 text-blue-500" />
          <CardTitle>統計サマリー</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                全国合計
              </span>
              <div className="text-lg font-bold">
                {stats.total}
                {unit && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {unit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                対象
              </span>
              <div className="text-lg font-bold">
                {stats.count}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  都道府県
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                平均値
              </span>
              <div className="text-lg font-bold">
                {stats.mean}
                {unit && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {unit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                中央値
              </span>
              <div className="text-lg font-bold">
                {stats.median}
                {unit && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {unit}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                最大値
              </span>
              <div className="text-lg font-bold">
                {stats.max.value}
                {unit && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {unit}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                {stats.max.name}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                最小値
              </span>
              <div className="text-lg font-bold">
                {stats.min.value}
                {unit && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {unit}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                {stats.min.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
