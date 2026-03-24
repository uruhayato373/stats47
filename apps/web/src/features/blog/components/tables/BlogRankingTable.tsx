"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";
import { DataTable } from "@stats47/components";
import type { ColumnDef } from "@tanstack/react-table";
import type { ChartDataNode } from "@stats47/visualization";
import { useChartData } from "../../hooks/useChartData";
import type { RankingTableConfig } from "../../types/chart-config.types";

type RankingRow = {
  rank: number;
  name: string;
  value: number;
  displayValue: string;
};

export function BlogRankingTable(props: RankingTableConfig) {
  const { data, isLoading } = useChartData<ChartDataNode[]>(props.dataPath);

  const processedData = useMemo<RankingRow[]>(() => {
    if (!data) return [];

    const sorted = [...data].sort((a, b) => b.value - a.value);
    const ranked = sorted.map((item, i) => {
      let displayValue: string;
      if (props.displayUnit === "億円") {
        displayValue = Math.round(item.value / 100000).toLocaleString("ja-JP");
      } else {
        displayValue = item.value.toLocaleString("ja-JP");
      }
      return {
        rank: i + 1,
        name: item.name,
        value: item.value,
        displayValue,
      };
    });

    const order = props.order ?? "top";
    const limit = props.limit != null ? Number(props.limit) : undefined;

    if (!limit) return ranked;

    if (order === "bottom") {
      return ranked.slice(-limit);
    }
    return ranked.slice(0, limit);
  }, [data, props.limit, props.order, props.displayUnit]);

  const columns = useMemo<ColumnDef<RankingRow>[]>(
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
        accessorKey: "name",
        header: "都道府県",
        meta: {
          filterable: true,
          filterPlaceholder: "都道府県で検索...",
          width: "150px",
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "displayValue",
        header: () => (
          <div className="text-right">
            {props.valueLabel ?? "値"}
            {props.displayUnit && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({props.displayUnit})
              </span>
            )}
          </div>
        ),
        meta: {},
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.getValue("displayValue")}
          </div>
        ),
      },
    ],
    [props.valueLabel, props.displayUnit]
  );

  if (isLoading) {
    return (
      <Card className="w-full border border-border shadow-sm rounded-sm">
        <CardContent className="p-4">
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || processedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <Card className="w-full border border-border shadow-sm rounded-sm">
      {props.title && (
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-4">
        <DataTable
          columns={columns}
          data={processedData}
          showIndex={false}
          maxRows={props.paginated ? 10 : processedData.length}
          enableFiltering={!!props.paginated}
          enableSorting={false}
          className="h-full flex flex-col"
        />
      </CardContent>
    </Card>
  );
}
