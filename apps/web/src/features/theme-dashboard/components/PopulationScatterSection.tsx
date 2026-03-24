"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import type { ScatterplotDataNode } from "@stats47/visualization/d3";
import { lookupArea } from "@stats47/area";

import type { ThemeIndicatorData } from "../types";

const Scatterplot = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.Scatterplot),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full rounded-md" />,
  },
);

interface Props {
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  selectedPrefectureCode: string | null;
}

/** 散布図の定義 */
interface ScatterConfig {
  id: string;
  title: string;
  xKey: string;
  yKey: string;
  /** y=x の対角線を表示（自然増減ゼロライン等） */
  diagonalLine?: boolean;
}

const SCATTER_CONFIGS: ScatterConfig[] = [
  {
    id: "birth-vs-death",
    title: "出生率 vs 死亡率",
    xKey: "crude-birth-rate",
    yKey: "crude-death-rate",
    diagonalLine: true,
  },
  {
    id: "tfr-vs-marriage-age",
    title: "合計特殊出生率 vs 平均初婚年齢",
    xKey: "average-age-of-first-marriage-wife",
    yKey: "total-fertility-rate",
  },
  {
    id: "growth-vs-fiscal",
    title: "人口増減率 vs 財政力指数",
    xKey: "fiscal-strength-index-prefecture",
    yKey: "population-growth-rate",
  },
  {
    id: "aging-vs-future",
    title: "高齢化率 vs 将来人口変化率",
    xKey: "ratio-65-plus",
    yKey: "future-population-change-rate-2050",
  },
];

/**
 * 人口動態 相関散布図セクション
 *
 * indicatorDataMap から2指標をペアにして47都道府県の散布図を描画。
 * 両軸のデータが存在する場合のみ描画。
 */
export function PopulationScatterSection({
  indicatorDataMap,
  selectedPrefectureCode,
}: Props) {
  const scatterData = useMemo(() => {
    return SCATTER_CONFIGS.map((config) => {
      const xData = indicatorDataMap[config.xKey];
      const yData = indicatorDataMap[config.yKey];

      if (!xData || !yData) return null;

      // 両方のデータに存在する都道府県コードを抽出
      const xMap = new Map(
        xData.rankingValues.map((v) => [v.areaCode, v.value]),
      );
      const yMap = new Map(
        yData.rankingValues.map((v) => [v.areaCode, v.value]),
      );

      const points: ScatterplotDataNode[] = [];
      for (const [areaCode, xValue] of xMap) {
        const yValue = yMap.get(areaCode);
        if (yValue == null) continue;
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
        config,
        points,
        xLabel: xData.rankingItem.title,
        yLabel: yData.rankingItem.title,
        xUnit: xData.rankingItem.unit,
        yUnit: yData.rankingItem.unit,
      };
    }).filter(Boolean) as Array<{
      config: ScatterConfig;
      points: ScatterplotDataNode[];
      xLabel: string;
      yLabel: string;
      xUnit: string;
      yUnit: string;
    }>;
  }, [indicatorDataMap, selectedPrefectureCode]);

  if (scatterData.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">相関分析</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scatterData.map(({ config, points, xLabel, yLabel, xUnit, yUnit }) => (
          <Card key={config.id} className="border border-border shadow-sm rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{config.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Scatterplot
                data={points}
                xLabel={xLabel}
                yLabel={yLabel}
                height={280}
                r={4}
                fill="hsl(215, 70%, 60%)"
                stroke="hsl(215, 70%, 40%)"
                strokeWidth={1}
                strokeOpacity={0.8}
                regressionLine={
                  config.diagonalLine
                    ? { slope: 1, intercept: 0 }
                    : undefined
                }
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                X: {xLabel}（{xUnit}）/ Y: {yLabel}（{yUnit}）
                {config.diagonalLine && " / 対角線: 出生率=死亡率（自然増減ゼロ）"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
