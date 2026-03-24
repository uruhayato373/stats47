"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import type { RankingValue } from "@stats47/ranking";
import { BoxplotChart } from "@stats47/visualization";
import { GitCompareArrows } from "lucide-react";

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
  const data = rankingValues.map((v) => ({
    areaCode: v.areaCode,
    areaName: v.areaName,
    value: v.value,
    unit: unit || v.unit,
  }));

  return (
    <Card className="w-full border border-border shadow-sm rounded-sm">
      <CardHeader>
        <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
        <CardTitle>地域別分布</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <BoxplotChart
          data={data}
          decimalPlaces={decimalPlaces}
          minValueType={minValueType}
        />
      </CardContent>
    </Card>
  );
}
