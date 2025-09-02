"use client";

import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatYearsTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatYearsTable({ data }: EstatYearsTableProps) {
  if (!data) return null;

  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
  const values = statisticalData.DATA_INF.VALUE;
  const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

  const columns: TableColumn<EstatValue>[] = [
    { key: "@time", label: "年度" },
    {
      key: "time_desc",
      label: "説明",
      render: (item) => item["@time"] || "-",
    },
  ];

  return (
    <DataTable
      data={valuesArray}
      columns={columns}
      emptyMessage="年度情報がありません"
    />
  );
}
