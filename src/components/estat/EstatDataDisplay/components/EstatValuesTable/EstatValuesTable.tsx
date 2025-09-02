"use client";

import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  if (!data) return null;

  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
  const values = statisticalData.DATA_INF.VALUE;
  const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

  const columns: TableColumn<EstatValue>[] = [
    {
      key: "category",
      label: "カテゴリ",
      render: (item) =>
        item["@cat01"] ||
        item["@cat02"] ||
        item["@cat03"] ||
        item["@cat04"] ||
        item["@cat05"] ||
        "-",
    },
    { key: "@area", label: "地域" },
    { key: "@time", label: "年度" },
    {
      key: "value",
      label: "値",
      render: (item) => (
        <span className="font-medium">{item.$ || String(item)}</span>
      ),
    },
    {
      key: "@unit",
      label: "単位",
      render: (item) => (
        <span className="text-gray-500 dark:text-neutral-400">
          {item["@unit"] || "-"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={valuesArray}
      columns={columns}
      emptyMessage="表形式で表示できるデータがありません"
    />
  );
}
