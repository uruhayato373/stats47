"use client";

import { DataTable } from "@/components/molecules/data-table";
import { ColumnDef } from "@tanstack/react-table";

import {
  convertToStatsSchema,
  EstatStatsDataResponse,
  formatStatsData,
} from "@/features/estat-api/stats-data";
import type { StatsSchema } from "@/types/stats";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  if (!data) return null;

  const formattedData = formatStatsData(data);
  const values = formattedData.values;

  // FormattedValueをStatsSchemaに変換（変換できない値は除外）
  const statsSchemaData: StatsSchema[] = values
    .map((value) => convertToStatsSchema(value))
    .filter((schema): schema is StatsSchema => schema !== undefined);

  // デバッグログ
  if (statsSchemaData.length === 0 && values.length > 0) {
    console.warn(
      "[EstatValuesTable] 変換可能なデータがありません:",
      {
        totalValues: values.length,
        sampleValue: values[0],
        sampleConversion: convertToStatsSchema(values[0]),
      }
    );
  }

  const columns: ColumnDef<StatsSchema>[] = [
    {
      accessorKey: "areaCode",
      header: "地域コード",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "areaName",
      header: "地域名",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "timeCode",
      header: "時間コード",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "timeName",
      header: "時間名",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "categoryCode",
      header: "カテゴリコード",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "categoryName",
      header: "カテゴリ名",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "value",
      header: "値",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "unit",
      header: "単位",
      meta: { filterable: true, filterType: "select" },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={statsSchemaData}
      emptyMessage="表形式で表示できるデータがありません"
      showIndex
    />
  );
}
