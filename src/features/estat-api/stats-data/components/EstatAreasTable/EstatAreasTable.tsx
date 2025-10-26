"use client";

import { Badge } from "@/components/atoms/ui/badge";
import { DataTable } from "@/components/molecules/data-table";
import { ColumnDef } from "@tanstack/react-table";

import {
  EstatStatsDataFormatter,
  EstatStatsDataResponse,
  FormattedArea,
} from "@/features/estat-api";

interface EstatAreasTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatAreasTable({ data }: EstatAreasTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const areas = formattedData.areas;

  const columns: ColumnDef<FormattedArea>[] = [
    {
      accessorKey: "areaName",
      header: "地域名",
      cell: ({ row }) => (
        <span className="text-gray-900 dark:text-neutral-100">
          {row.original.areaName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "areaCode",
      header: "地域コード",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {row.original.areaCode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "level",
      header: "レベル",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.level || "-"}</Badge>
      ),
    },
    {
      accessorKey: "parentCode",
      header: "親コード",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {row.original.parentCode || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={areas}
      emptyMessage="地域情報がありません"
      showIndex
    />
  );
}
