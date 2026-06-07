"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { BarChart3 } from "lucide-react";

import type { RankingValue } from "@stats47/ranking";

// グラフ本体は SSR 不要 + 重い D3 のため dynamic import (#223 完了条件: SSR 不要・dynamic import)
const RankingAllPrefecturesChart = dynamic(
  () =>
    import("../RankingBarChart/RankingAllPrefecturesChart").then(
      (m) => m.RankingAllPrefecturesChart,
    ),
  {
    ssr: false,
    loading: () => <div className="h-[280px] w-full animate-pulse rounded bg-muted" />,
  },
);

interface Props {
  /** ランキング値 (年度セレクター連動で親から渡る) */
  rankingValues: RankingValue[];
}

/**
 * テーブルの前に上位10件の横棒グラフを置き「グラフ→データ」の読み順を作る (#223)。
 * 全件は下のテーブル/地図に委ね、ここは上位の magnitude を一目で掴ませる。
 */
export function RankingTop10Chart({ rankingValues }: Props) {
  const top10 = rankingValues.filter(
    (v) => v.areaCode !== "00000" && v.value !== null && v.rank != null && v.rank <= 10,
  );
  if (top10.length === 0) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          上位10件
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <RankingAllPrefecturesChart rankingValues={top10} />
      </CardContent>
    </Card>
  );
}
