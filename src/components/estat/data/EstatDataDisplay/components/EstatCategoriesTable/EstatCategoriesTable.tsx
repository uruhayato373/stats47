"use client";

import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatCategoriesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatCategoriesTable({
  data,
}: EstatCategoriesTableProps) {
  if (!data) return null;

  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
  const values = statisticalData.DATA_INF.VALUE;
  const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

  const columns: TableColumn<EstatValue>[] = [
    { key: "@cat01", label: "カテゴリ01" },
    { key: "@cat02", label: "カテゴリ02" },
    { key: "@cat03", label: "カテゴリ03" },
    { key: "@cat04", label: "カテゴリ04" },
    { key: "@cat05", label: "カテゴリ05" },
  ];

  return (
    <DataTable
      data={valuesArray}
      columns={columns}
      emptyMessage="カテゴリ情報がありません"
    />
  );
}
