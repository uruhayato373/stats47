"use client";



import { useMemo } from "react";


import { DataTable, cn } from "@stats47/components";
import { Card, CardContent, CardHeader } from "@stats47/components/atoms/ui/card";
import {
  rankByValue,
  computeRankingStats,
  type RankingItem,
  type RankingValue,
  type RankingStats,
} from "@stats47/ranking";
import { ColumnDef } from "@tanstack/react-table";

import type { StatsSchema } from "@stats47/types";


interface Props {
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** ランキング項目情報（unit、rankingDirectionなど） */
  rankingItem?: RankingItem;
  /** CSSクラス名 */
  className?: string;
  /** CardHeader右側に表示するアクション要素 */
  headerActions?: React.ReactNode;
  /** カードタイトル（省略時: 都道府県別データ） */
  cardTitle?: string;
  /** カードサブタイトル */
  cardSubtitle?: string;
  /** カード下部に表示するコンテンツ（出典等） */
  cardFooter?: React.ReactNode;
}

type RankingDataRow = RankingValue & {
  deviationValue: number | null;
};

export function RankingDataTable({
  rankingValues,
  rankingItem,
  className,
  headerActions,
  cardFooter,
}: Props) {
  // 偏差値計算用の統計情報を計算
  const statistics = useMemo<RankingStats | null>(() => {
    return rankingValues ? computeRankingStats(rankingValues) : null;
  }, [rankingValues]);

  // データを加工（順位、偏差値を追加）
  const processedData = useMemo<RankingDataRow[]>(() => {
    if (!rankingValues) return [];

    const validItems: StatsSchema[] = [];
    for (const item of rankingValues) {
      if (item.areaCode !== "00000") {
        validItems.push(item);
      }
    }

    const dataWithRank = rankByValue(validItems);

    return dataWithRank.map((item) => {
      // 偏差値計算
      let deviationValue: number | null = null;
      if (statistics && statistics.hasVariation) {
        deviationValue =
          50 +
          (10 * (item.value - statistics.mean)) / statistics.standardDeviation;
      } else if (statistics) {
        deviationValue = 50;
      }

      return {
        ...item,
        deviationValue,
      };
    });
  }, [rankingValues, statistics]);

  // カラム定義
  const columns = useMemo<ColumnDef<RankingDataRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "順位",
        meta: { width: "60px" },
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.getValue("rank")}</div>
        ),
      },
      {
        accessorKey: "areaName",
        header: "都道府県",
        meta: { width: "150px" },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.areaName}</div>
        ),
      },
      {
        accessorKey: "value",
        header: () => <div className="text-right">値</div>,
        meta: {},
        cell: ({ row }) => {
          const unit = rankingItem?.unit || processedData[0]?.unit || "";
          return (
            <div className="text-right font-mono whitespace-nowrap">
              {row.getValue<number>("value").toLocaleString("ja-JP")}
              {unit && (
                <span className="text-xs text-muted-foreground ml-1">{unit}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "deviationValue",
        header: "偏差値",
        meta: { width: "80px" },
        cell: ({ row }) => {
          const val = row.getValue<number | null>("deviationValue");
          return (
            <div className="text-right font-mono text-muted-foreground">
              {val === null ? "-" : val.toFixed(1)}
            </div>
          );
        },
      },
    ],
    [rankingItem, processedData]
  );

  if (!rankingValues || processedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        {headerActions}
      </CardHeader>
      <CardContent className="p-4">
        <DataTable
          columns={columns}
          data={processedData}
          showIndex={false}
          maxRows={10}
          enableSorting={true}
          showRowCount={false}
          className="h-full flex flex-col"
          getRowId={(row) => row.areaCode}
        />
      </CardContent>
      {cardFooter && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">{cardFooter}</div>
      )}
    </Card>
  );
}
