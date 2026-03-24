"use client";



import { Table } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@stats47/components";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { StatsSchema } from "@stats47/types";

import { cn } from "@stats47/components";

import {
  rankByValue,
  computeRankingStats,
} from "@stats47/ranking";

import type { RankingStats } from "@stats47/ranking";


interface Props {
  /** ランキングデータ */
  rankingValues: (StatsSchema | RankingValue)[];
  /** ランキング項目情報（unit、rankingDirectionなど） */
  rankingItem?: RankingItem;
  /** CSSクラス名 */
  className?: string;
  /** CardHeader右側に表示するアクション要素 */
  headerActions?: React.ReactNode;
}

type RankingDataRow = RankingValue & {
  deviationValue: number | null;
};

export function RankingDataTable({
  rankingValues,
  rankingItem,
  className,
  headerActions,
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
    <Card className={cn("w-full border border-border shadow-sm rounded-sm", className)}>
      <CardHeader>
        <Table className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="flex-1">都道府県別データ</CardTitle>
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
    </Card>
  );
}
