"use client";

import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatAreasTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatAreasTable({ data }: EstatAreasTableProps) {
  if (!data) return null;

  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
  const values = statisticalData.DATA_INF.VALUE;
  const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

  const columns: TableColumn<EstatValue>[] = [
    { key: "@area", label: "地域コード" },
    {
      key: "area_name",
      label: "地域名",
      render: (item) => (
        <span className="text-gray-700 dark:text-neutral-300">
          {item["@area"] || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={valuesArray}
      columns={columns}
      emptyMessage="地域情報がありません"
    />
  );
}
