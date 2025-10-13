"use client";

import { EstatStatsDataResponse } from "@/lib/estat/types";
import { FormattedYear } from "@/lib/estat/types";
import { EstatDataFormatter } from "@/lib/estat/statsdata/EstatDataFormatter";
import DataTable, { TableColumn } from "@/components/common/DataTable";
import { useStyles } from "@/hooks/useStyles";

interface EstatYearsTableProps {
  data: EstatStatsDataResponse;
}

export default function EstatYearsTable({ data }: EstatYearsTableProps) {
  const styles = useStyles();
  if (!data) return null;

  const formattedData = EstatDataFormatter.formatStatsData(data);
  const years = formattedData.years;

  const columns: TableColumn<FormattedYear>[] = [
    {
      key: "timeCode",
      label: "時間コード",
      render: (item) => (
        <span className={styles.text.secondary}>{item.timeCode || "-"}</span>
      ),
    },
    {
      key: "timeName",
      label: "時間名",
      render: (item) => (
        <span className={styles.text.primary}>{item.timeName || "-"}</span>
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
