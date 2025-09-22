"use client";

import { EstatStatsDataResponse } from "@/lib/estat/types";
import { FormattedValue } from "@/types/estat/formatted";
import { EstatStatsDataService } from "@/lib/estat/statsdata";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { useStyles } from "@/hooks/useStyles";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  const styles = useStyles();
  if (!data) return null;

  const formattedData = EstatStatsDataService.formatStatsData(data);
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
      render: (item) => item.areaInfo?.displayName || "-",
    },
    {
      key: "timeName",
      label: "timeName",
      filterable: true,
      filterType: "select",
      render: (item) => item.yearInfo?.timeName || "-",
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
