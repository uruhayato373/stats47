"use client";

import { DataTable } from "@/components/organisms/DataTable";
import { ColumnDef } from "@tanstack/react-table";

import {
  EstatStatsDataFormatter,
  EstatStatsDataResponse,
  FormattedYear,
} from "@/lib/estat-api";

interface EstatYearsTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatYearsTable({ data }: EstatYearsTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const years = formattedData.years;

  const columns: ColumnDef<FormattedYear>[] = [
    {
      accessorKey: "timeCode",
      header: "時間コード",
      cell: ({ row }) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {row.original.timeCode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "timeName",
      header: "時間名",
      cell: ({ row }) => (
        <span className="text-gray-900 dark:text-neutral-100">
          {row.original.timeName || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={years}
      emptyMessage="年度情報がありません"
      showIndex
    />
  );
}
