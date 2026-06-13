"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { GitCompareArrows } from "lucide-react";

import type { RankingValue } from "@stats47/ranking";

const BoxplotChartDynamic = dynamic(
  () => import("@stats47/visualization/d3/BoxplotChart").then((m) => m.BoxplotChart),
  {
    ssr: false,
    loading: () => <div className="h-[280px] w-full animate-pulse rounded bg-muted" />,
  },
);

interface Props {
  rankingValues: RankingValue[];
  unit?: string;
  decimalPlaces?: number;
  minValueType?: "zero" | "data-min";
}

/**
 * ランキング箱ひげ図コンポーネント
 *
 * 7地方区分ごとの分布を箱ひげ図＋ジッター散布図で表示する。
 */
export function RankingBoxplotChart({
  rankingValues,
  unit,
  decimalPlaces = 0,
  minValueType,
}: Props) {
  if (!rankingValues || rankingValues.length === 0) {
    return null;
  }

  // RankingValue → PrefectureData 変換（unit を付与）
  const data = rankingValues.flatMap((v) =>
    v.value !== null ? [{ areaCode: v.areaCode, areaName: v.areaName, value: v.value, unit: unit || v.unit }] : []
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
        <CardTitle>地域別分布</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <BoxplotChartDynamic
          data={data}
          decimalPlaces={decimalPlaces}
          minValueType={minValueType}
        />
      </CardContent>
    </Card>
  );
}
