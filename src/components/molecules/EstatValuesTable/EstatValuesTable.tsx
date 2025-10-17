"use client";

import {
  EstatStatsDataResponse,
  FormattedValue,
  EstatStatsDataFormatter,
} from "@/lib/estat-api";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  if (!data) return null;

  const formattedData = EstatStatsDataFormatter.formatStatsData(data);
  const values = formattedData.values;

  const columns: TableColumn<FormattedValue>[] = [
    { key: "value", label: "value", filterable: true, filterType: "text" },
    {
      key: "numericValue",
      label: "numericValue",
      filterable: true,
      filterType: "text",
    },
    {
      key: "displayValue",
      label: "displayValue",
      filterable: true,
      filterType: "text",
    },
    { key: "unit", label: "unit", filterable: true, filterType: "select" },
    {
      key: "areaCode",
      label: "areaCode",
      filterable: true,
      filterType: "select",
    },
    {
      key: "areaName",
      label: "areaName",
      filterable: true,
      filterType: "select",
      render: (item) => item.areaName || "-",
    },
    {
      key: "timeName",
      label: "timeName",
      filterable: true,
      filterType: "select",
      render: (item) => item.timeName || "-",
    },
  ];

  return (
    <DataTable
      data={values}
      columns={columns}
      emptyMessage="表形式で表示できるデータがありません"
    />
  );
}
