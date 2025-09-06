"use client";

import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { useStyles } from "@/hooks/useStyles";

interface EstatValuesTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  const styles = useStyles();
  if (!data) return null;

  const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
  const values = statisticalData.DATA_INF.VALUE;
  const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

  const columns: TableColumn<EstatValue>[] = [
    {
      key: "category",
      label: "カテゴリ",
      render: (item) => (
        <span className={styles.text.primary}>
          {item["@cat01"] ||
            item["@cat02"] ||
            item["@cat03"] ||
            item["@cat04"] ||
            item["@cat05"] ||
            "-"}
        </span>
      ),
    },
    { key: "@area", label: "地域" },
    { key: "@time", label: "年度" },
    {
      key: "value",
      label: "値",
      render: (item) => (
        <span className={`${styles.text.primary} font-medium`}>
          {item.$ || String(item)}
        </span>
      ),
    },
    {
      key: "@unit",
      label: "単位",
      render: (item) => (
        <span className={styles.text.secondary}>
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
