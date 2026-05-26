"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { lookupArea } from "@stats47/area";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import { Radar as RadarIcon } from "lucide-react";

import type { ThemeIndicatorData } from "../types";
import type { RadarAxis, RadarDataSeries } from "@stats47/visualization/d3";

const RadarChart = dynamic(
  () => import("@stats47/visualization/d3").then((mod) => mod.RadarChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full rounded-md" />,
  },
);

interface Props {
  /** テーマ内の全 rankingKey (表示順) */
  rankingKeys: string[];
  indicatorDataMap: Record<string, ThemeIndicatorData>;
  /** 選択中の都道府県 (null なら全国平均線のみ) */
  selectedPrefectureCode: string | null;
  /** 軸数の上限 (見やすさ優先) */
  maxAxes?: number;
}

interface PercentileResult {
  axes: RadarAxis[];
  series: RadarDataSeries[];
}

/**
 * テーマ内の全指標について、選択県の **percentile (順位ベース正規化)** をレーダーで描画。
 *
 * - 各指標を「47 都道府県中の順位 → 0-100% に変換」して比較可能にする
 * - 全国平均線 (50%) も重ねる
 * - 順位は「値が大きい = 上位」を前提 (小さいほうが良い指標は今後 inverted フラグで対応)
 */
export function ThemeRadarChart({
  rankingKeys,
  indicatorDataMap,
  selectedPrefectureCode,
  maxAxes = 8,
}: Props) {
  const radarData = useMemo<PercentileResult | null>(() => {
    // 値があるものだけ採用 (最大 maxAxes)
    const validKeys = rankingKeys
      .filter((k) => {
        const d = indicatorDataMap[k];
        return d && d.rankingValues.length >= 10;
      })
      .slice(0, maxAxes);

    if (validKeys.length < 3) return null;

    const axes: RadarAxis[] = validKeys.map((key) => ({
      key,
      label: indicatorDataMap[key].rankingItem.title.length > 12
        ? indicatorDataMap[key].rankingItem.title.slice(0, 11) + "…"
        : indicatorDataMap[key].rankingItem.title,
      max: 100,
    }));

    // percentile 算出 (rank ベース、N 県中 r 位 → (N-r)/(N-1) * 100)
    const percentileFor = (key: string, areaCode: string): number | null => {
      const values = indicatorDataMap[key].rankingValues;
      const n = values.length;
      if (n < 2) return null;
      const target = values.find((v) => v.areaCode === areaCode);
      if (!target || target.rank == null) return null;
      return ((n - target.rank) / (n - 1)) * 100;
    };

    const series: RadarDataSeries[] = [];

    // 全国平均線 (常に 50)
    series.push({
      label: "全国中央 (50 パーセンタイル)",
      values: Object.fromEntries(validKeys.map((k) => [k, 50])),
      color: "hsl(220, 10%, 70%)",
    });

    if (selectedPrefectureCode) {
      const prefValues: Record<string, number> = {};
      for (const key of validKeys) {
        const p = percentileFor(key, selectedPrefectureCode);
        if (p !== null) prefValues[key] = p;
      }
      if (Object.keys(prefValues).length > 0) {
        series.push({
          label: lookupArea(selectedPrefectureCode)?.areaName ?? selectedPrefectureCode,
          values: prefValues,
          color: "hsl(215, 70%, 50%)",
        });
      }
    }

    return { axes, series };
  }, [rankingKeys, indicatorDataMap, selectedPrefectureCode, maxAxes]);

  if (!radarData) return null;

  const areaName = selectedPrefectureCode
    ? lookupArea(selectedPrefectureCode)?.areaName ?? "選択地域"
    : null;

  return (
    <Card className="border border-border shadow-sm rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <RadarIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">テーマ全体プロフィール</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {areaName
            ? `${areaName} のテーマ内全指標を percentile (順位の偏差) で表示。100 = 全国 1 位、0 = 全国最下位。`
            : "地図で都道府県を選択するとレーダー描画されます。"}
        </p>
      </CardHeader>
      <CardContent>
        {selectedPrefectureCode ? (
          <RadarChart
            axes={radarData.axes}
            data={radarData.series}
            width={420}
            height={320}
            gridLevels={5}
            fillOpacity={0.2}
            showLegend={true}
            tooltipFormatter={(v) => `${v.toFixed(0)} 位パーセンタイル`}
          />
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-md">
            地図で都道府県を選択するとここにレーダーが出ます
          </div>
        )}
      </CardContent>
    </Card>
  );
}
