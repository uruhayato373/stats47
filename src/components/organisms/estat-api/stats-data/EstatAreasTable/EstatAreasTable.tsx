"use client";

import {
  EstatStatsDataResponse,
  FormattedArea,
  EstatStatsDataFormatter,
} from "@/lib/estat-api";
import DataTable, { type TableColumn } from "@/components/molecules/DataTable";

interface EstatAreasTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatAreasTable({ data }: EstatAreasTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const areas = formattedData.areas;

  const columns: TableColumn<FormattedArea>[] = [
    {
      key: "areaName",
      label: "地域名",
      render: (item) => (
        <span className="text-gray-900 dark:text-neutral-100">
          {item.areaName || "-"}
        </span>
      ),
    },
    {
      key: "areaCode",
      label: "地域コード",
      render: (item) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {item.areaCode || "-"}
        </span>
      ),
    },
    {
      key: "level",
      label: "レベル",
      render: (item) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {item.level || "-"}
        </span>
      ),
    },
    {
      key: "parentCode",
      label: "親コード",
      render: (item) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {item.parentCode || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={areas}
      columns={columns}
      emptyMessage="地域情報がありません"
    />
  );
}
