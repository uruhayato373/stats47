"use client";

import React from "react";
import { useStyles } from "@/hooks/useStyles";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (item: T, index: number) => string | React.ReactNode;
}

export interface DataTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage: string;
  maxRows?: number;
}

export default function DataTable<T = Record<string, unknown>>({
  data,
  columns,
  emptyMessage,
  maxRows = 100,
}: DataTableProps<T>) {
  const styles = useStyles();

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${styles.text.muted}`}>
        {emptyMessage}
      </div>
    );
  }

  const displayData = data.slice(0, maxRows);

  return (
    <div className={`${styles.table.container} ${styles.card.base} ${styles.text.secondary}`}>
      <table className={styles.table.table}>
        <thead>
          <tr>
            <th className={styles.table.headerCell}>
              <p className={`${styles.table.headerText} ${styles.text.tertiary}`}>
                インデックス
              </p>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={styles.table.headerCell}
              >
                <p className={`${styles.table.headerText} ${styles.text.tertiary}`}>
                  {column.label}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((item, index) => (
            <tr key={index}>
              <td
                className={
                  index !== displayData.length - 1
                    ? styles.table.bodyCellWithBorder
                    : styles.table.bodyCell
                }
              >
                <p className={`${styles.table.bodyText} ${styles.text.primary}`}>
                  {index + 1}
                </p>
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={
                    index !== displayData.length - 1
                      ? styles.table.bodyCellWithBorder
                      : styles.table.bodyCell
                  }
                >
                  <div className={`${styles.table.bodyText} ${styles.text.secondary}`}>
                    {column.render
                      ? column.render(item, index)
                      : String(
                          (item as Record<string, unknown>)[column.key] || "-"
                        )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > maxRows && (
        <div className={styles.table.footer}>
          <p className={`${styles.table.footerText} ${styles.text.muted}`}>
            最初の{maxRows}件を表示中 (全{data.length}件)
          </p>
        </div>
      )}
    </div>
  );
}
