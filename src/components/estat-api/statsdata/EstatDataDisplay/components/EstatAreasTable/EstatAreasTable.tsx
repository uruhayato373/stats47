"use client";

import { EstatStatsDataResponse } from "@/lib/estat/types";
import { FormattedArea } from "@/lib/estat/types";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { useStyles } from "@/hooks/useStyles";

interface EstatAreasTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatAreasTable({ data }: EstatAreasTableProps) {
  const styles = useStyles();
  if (!data) return null;

  const formattedData = EstatStatsDataService.formatStatsData(data);
  const areas = formattedData.areas;

  const columns: TableColumn<FormattedArea>[] = [
    {
      key: "areaName",
      label: "地域名",
      render: (item) => (
        <span className={styles.text.primary}>{item.areaName || "-"}</span>
      ),
    },
    {
      key: "areaCode",
      label: "地域コード",
      render: (item) => (
        <span className={styles.text.secondary}>{item.areaCode || "-"}</span>
      ),
    },
    {
      key: "level",
      label: "レベル",
      render: (item) => (
        <span className={styles.text.secondary}>{item.level || "-"}</span>
      ),
    },
    {
      key: "parentCode",
      label: "親コード",
      render: (item) => (
        <span className={styles.text.secondary}>{item.parentCode || "-"}</span>
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
