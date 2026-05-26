"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { lookupArea } from "@stats47/area";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { ScatterChart as ScatterIcon } from "lucide-react";

import type { ThemeIndicatorData } from "../types";
import type { ScatterplotDataNode } from "@stats47/visualization/d3";

const Scatterplot = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.Scatterplot),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-md" />,
  },
);

interface ScatterPair {
  xKey: string;
  yKey: string;
  title?: string;
  diagonalLine?: boolean;
}

interface Props {
  /** scatter で見せたい指標ペア (上限 3-4 推奨) */
  pairs: ScatterPair[];
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  selectedPrefectureCode: string | null;
}

/**
 * テーマ汎用の相関散布図セクション
 *
 * `PopulationScatterSection` を汎用化したもの。`pairs` で 2 指標ペアを宣言すると、
 * 47 都道府県の散布図を描画。選択中の都道府県はハイライトされる。
 *
 * ペア指定が無い場合は何も描画しない (auto-derive は呼び出し側で実装)。
 */
export function ThemeCorrelationScatter({
  pairs,
  indicatorDataMap,
  selectedPrefectureCode,
}: Props) {
  const scatterData = useMemo(() => {
    return pairs
      .map((pair) => {
        const xData = indicatorDataMap[pair.xKey];
        const yData = indicatorDataMap[pair.yKey];
        if (!xData || !yData) return null;

        const xMap = new Map(xData.rankingValues.map((v) => [v.areaCode, v.value]));
        const yMap = new Map(yData.rankingValues.map((v) => [v.areaCode, v.value]));

        const points: ScatterplotDataNode[] = [];
        for (const [areaCode, xValue] of xMap) {
          const yValue = yMap.get(areaCode);
          if (xValue == null || yValue == null) continue;
          if (typeof xValue !== "number" || typeof yValue !== "number") continue;
          if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) continue;
          const areaName = lookupArea(areaCode)?.areaName ?? areaCode;
          points.push({
            x: xValue,
            y: yValue,
            label: areaName,
            isSelected: areaCode === selectedPrefectureCode,
          });
        }

        if (points.length < 3) return null;

        return {
          pair,
          points,
          xLabel: xData.rankingItem.title,
          yLabel: yData.rankingItem.title,
          xUnit: xData.rankingItem.unit,
          yUnit: yData.rankingItem.unit,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [pairs, indicatorDataMap, selectedPrefectureCode]);

  if (scatterData.length === 0) return null;

  return (
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ScatterIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">指標どうしの相関</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          47 都道府県 × 2 指標の散布図。{selectedPrefectureCode ? "選択県は赤" : "県をクリックで赤色ハイライト"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {scatterData.map(({ pair, points, xLabel, yLabel, xUnit, yUnit }) => (
          <div key={`${pair.xKey}-${pair.yKey}`}>
            <h3 className="text-xs font-medium mb-1">
              {pair.title ?? `${xLabel} × ${yLabel}`}
            </h3>
            <Scatterplot
              data={points}
              xLabel={xLabel}
              yLabel={yLabel}
              height={240}
              r={4}
              fill="hsl(215, 70%, 60%)"
              stroke="hsl(215, 70%, 40%)"
              strokeWidth={1}
              strokeOpacity={0.8}
              regressionLine={
                pair.diagonalLine ? { slope: 1, intercept: 0 } : undefined
              }
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              X: {xLabel} ({xUnit}) / Y: {yLabel} ({yUnit})
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * テーマの指標から auto-derive で scatter ペアを生成するヘルパー。
 *
 * 1 番目の primary + その他全て、または最初の 3 指標から 2-3 ペアを作る。
 * 専用 config (D1 theme_metrics.chart_config_json) が無い場合のフォールバック。
 */
export function deriveAutoScatterPairs(
  rankingKeys: string[],
  indicatorDataMap: Record<string, ThemeIndicatorData>,
  max: number = 3,
): ScatterPair[] {
  const availableKeys = rankingKeys.filter(
    (k) => indicatorDataMap[k] && indicatorDataMap[k].rankingValues.length >= 3,
  );
  if (availableKeys.length < 2) return [];

  const pairs: ScatterPair[] = [];
  const base = availableKeys[0];
  for (let i = 1; i < availableKeys.length && pairs.length < max; i++) {
    pairs.push({ xKey: base, yKey: availableKeys[i] });
  }
  return pairs;
}
