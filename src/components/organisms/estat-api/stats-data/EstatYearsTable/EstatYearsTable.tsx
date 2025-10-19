"use client";

import {
  EstatStatsDataResponse,
  FormattedYear,
  EstatStatsDataFormatter,
} from "@/lib/estat-api";
import DataTable, { type TableColumn } from "@/components/molecules/DataTable";

interface EstatYearsTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatYearsTable({ data }: EstatYearsTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const years = formattedData.years;

  const columns: TableColumn<FormattedYear>[] = [
    {
      key: "timeCode",
      label: "時間コード",
      render: (item) => (
        <span className="text-gray-600 dark:text-neutral-300">
          {item.timeCode || "-"}
        </span>
      ),
    },
    {
      key: "timeName",
      label: "時間名",
      render: (item) => (
        <span className="text-gray-900 dark:text-neutral-100">
          {item.timeName || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={years}
      columns={columns}
      emptyMessage="年度情報がありません"
    />
  );
}
