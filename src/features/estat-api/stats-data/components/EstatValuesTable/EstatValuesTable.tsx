"use client";

import { DataTable } from "@/components/organisms/DataTable";
import { ColumnDef } from "@tanstack/react-table";

import {
  EstatStatsDataFormatter,
  EstatStatsDataResponse,
  FormattedValue,
} from "@/features/estat-api";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const values = formattedData.values;

  const columns: ColumnDef<FormattedValue>[] = [
    {
      accessorKey: "value",
      header: "value",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "numericValue",
      header: "numericValue",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "displayValue",
      header: "displayValue",
      meta: { filterable: true, filterType: "text" },
    },
    {
      accessorKey: "unit",
      header: "unit",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "areaCode",
      header: "areaCode",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "areaName",
      header: "areaName",
      cell: ({ row }) => row.original.areaName || "-",
      meta: { filterable: true, filterType: "select" },
    },
    {
      accessorKey: "timeName",
      header: "timeName",
      cell: ({ row }) => row.original.timeName || "-",
      meta: { filterable: true, filterType: "select" },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={values}
      emptyMessage="表形式で表示できるデータがありません"
      showIndex
    />
  );
}
