"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { BarChart3 } from "lucide-react";


import { RankingAllPrefecturesChart } from "./RankingAllPrefecturesChart";

import type { RankingValue } from "@stats47/ranking";
import type { StatsSchema } from "@stats47/types";


interface Props {
  /** ランキングデータ（都道府県別の統計値） */
  rankingValues: (StatsSchema | RankingValue)[];
}

/**
 * ランキングカラムチャートコンポーネント
 *
 * 全47都道府県のランキングデータを横棒グラフで表示する。
 * スクロール可能な形式で全データを一覧表示する。
 */
export function RankingBarChart({ rankingValues }: Props) {
  if (!rankingValues || rankingValues.length === 0) {
    return null;
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <CardTitle>ランキングチャート</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 min-h-0">
        <RankingAllPrefecturesChart rankingValues={rankingValues} />
      </CardContent>
    </Card>
  );
}
