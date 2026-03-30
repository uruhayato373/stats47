"use client";

import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@stats47/components";
import { Card, CardContent, CardHeader, CardTitle } from "@stats47/components/atoms/ui/card";

import type { ColumnDef } from "@tanstack/react-table";

type RankingRow = {
  rank: number;
  name: string;
  value: number;
  displayValue: string;
};

interface MarkdownRankingTableProps {
  rankingKey: string;
  title?: string;
  valueLabel?: string;
  limit?: number;
  order?: "top" | "bottom";
  paginated?: boolean;
  displayUnit?: string;
}

export function MarkdownRankingTable(props: MarkdownRankingTableProps) {
  const [rawData, setRawData] = useState<Array<{ name: string; value: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/ranking-data/${props.rankingKey}`);
        const data = await res.json();
        if (!cancelled) setRawData(data);
      } catch {
        if (!cancelled) setRawData([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [props.rankingKey]);

  const processedData = useMemo<RankingRow[]>(() => {
    if (!rawData) return [];
    const sorted = [...rawData].sort((a, b) => b.value - a.value);
    const ranked = sorted.map((item, i) => {
      const displayValue =
        props.displayUnit === "億円"
          ? Math.round(item.value / 100000).toLocaleString("ja-JP")
          : item.value.toLocaleString("ja-JP");
      return { rank: i + 1, name: item.name, value: item.value, displayValue };
    });
    const limit = props.limit;
    if (!limit) return ranked;
    return props.order === "bottom" ? ranked.slice(-limit) : ranked.slice(0, limit);
  }, [rawData, props.limit, props.order, props.displayUnit]);

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
        meta: { filterable: true, filterPlaceholder: "都道府県で検索...", width: "150px" },
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "displayValue",
        header: () => (
          <div className="text-right">
            {props.valueLabel ?? "値"}
            {props.displayUnit && (
              <span className="ml-1 text-xs text-muted-foreground">({props.displayUnit})</span>
            )}
          </div>
        ),
        meta: {},
        cell: ({ row }) => (
          <div className="text-right font-mono">{row.getValue("displayValue")}</div>
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

  if (!rawData || processedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">データがありません</div>
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
