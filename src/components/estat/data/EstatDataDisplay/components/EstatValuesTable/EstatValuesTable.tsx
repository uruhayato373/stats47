"use client";

import { EstatStatsDataResponse } from "@/types/estat";
import { FormattedValue } from "@/types/estat/formatted";
import { EstatDataFormatter } from "@/lib/estat/response/EstatDataFormatter";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { useStyles } from "@/hooks/useStyles";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  const styles = useStyles();
  if (!data) return null;

  const formattedData = EstatDataFormatter.formatStatsData(data);
  const values = formattedData.values;

  const columns: TableColumn<FormattedValue>[] = [
    { key: "value", label: "value" },
    { key: "numericValue", label: "numericValue" },
    { key: "displayValue", label: "displayValue" },
    { key: "unit", label: "unit" },
    { key: "areaCode", label: "areaCode" },
    {
      key: "areaName",
      label: "areaName",
      render: (item) => item.areaInfo?.displayName || "-"
    },
    {
      key: "timeName",
      label: "timeName",
      render: (item) => item.yearInfo?.timeName || "-"
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
