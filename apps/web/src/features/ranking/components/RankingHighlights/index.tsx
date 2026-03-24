"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import {
  computeBottomRanking,
  computeRankingStats,
  rankByValue,
  computeTopRankings,
  getMaxDecimalPlacesFromRankings,
  type RankingValue
} from "@stats47/ranking";
import type { StatsSchema } from "@stats47/types";
import { Minus, TrendingUp } from "lucide-react";

import { formatValueWithPrecision } from "@stats47/utils";

import { RankingRankBadge } from "./RankingRankBadge";

interface Props {
  rankingValues: (StatsSchema | RankingValue)[];
}

export function RankingHighlights({
  rankingValues,
}: Props) {
  // 全国データを除外してランキング計算
  const rankedData = useMemo(() => {
    const filtered = rankingValues.filter(v => v.areaCode !== "00000");
    return rankByValue(filtered);
  }, [rankingValues]);

  // Top 3 items
  const top3 = useMemo(() => computeTopRankings(rankedData), [rankedData]);

  // Bottom item for display in stats (if needed)
  const bottom = useMemo(() => computeBottomRanking(rankedData), [rankedData]);

  // Statistics
  // 以前の実装では null チェックがあったが、computeRankingStats はデータがあればオブジェクトを返す
  const stats = useMemo(() => computeRankingStats(rankedData), [rankedData]);

  // 小数点以下の最大桁数を計算
  const maxDecimalPlaces = useMemo(
    () => getMaxDecimalPlacesFromRankings(rankedData),
    [rankedData]
  );

  // データが空の場合は何も表示しない
  if (!rankingValues || rankingValues.length === 0) {
    return null;
  }

  // Determine unit from the first item
  const unit = rankingValues.length > 0 ? rankingValues[0].unit : "";

  // Helper to format values
  const formatStatsValue = (val: number) => formatValueWithPrecision(val, maxDecimalPlaces);

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Top 3 Summary */}
      <Card className="border border-border shadow-sm rounded-sm h-full">
        <CardHeader>
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle>Top 3 都道府県</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {top3.map((item) => (
              <div
                key={item.areaCode}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <RankingRankBadge rank={item.rank ?? 0} />
                  <span className="font-bold text-sm">{item.areaName}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">
                    {formatStatsValue(item.value)}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      {stats && (
        <Card className="border border-border shadow-sm rounded-sm h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-blue-500" />
              <CardTitle>統計サマリー</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* 平均値 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium mb-1">平均値</span>
                <div className="text-base font-bold">
                  {formatStatsValue(stats.mean)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
                </div>
              </div>

              {/* 中央値 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium mb-1">中央値</span>
                <div className="text-base font-bold">
                  {formatStatsValue(stats.median)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
                </div>
              </div>

              {/* 最大値 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium mb-1">最大値</span>
                <div className="text-base font-bold">
                  {formatStatsValue(stats.max)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
                </div>
                {/* 最大値を持つ都道府県（Top1と同じだが一応表示） */}
                {top3.length > 0 && (
                  <span className="text-xs text-muted-foreground mt-0.5">{top3[0].areaName}</span>
                )}
              </div>

              {/* 最小値 */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium mb-1">最小値</span>
                <div className="text-base font-bold">
                  {formatStatsValue(stats.min)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
                </div>
                {bottom && (
                  <span className="text-xs text-muted-foreground mt-0.5">{bottom.areaName}</span>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
