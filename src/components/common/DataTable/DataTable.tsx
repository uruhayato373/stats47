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
    <div className={`relative flex flex-col w-full h-full overflow-scroll shadow-md rounded-xl bg-clip-border ${styles.card.base} ${styles.text.secondary}`}>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-b border-gray-200 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700">
              <p className={`block font-sans text-sm antialiased font-normal leading-none opacity-70 ${styles.text.tertiary}`}>
                インデックス
              </p>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="p-4 border-b border-gray-200 bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700"
              >
                <p className={`block font-sans text-sm antialiased font-normal leading-none opacity-70 ${styles.text.tertiary}`}>
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
                className={`p-4 ${
                  index !== displayData.length - 1
                    ? "border-b border-gray-200 dark:border-neutral-600"
                    : ""
                }`}
              >
                <p className={`block font-sans text-sm antialiased font-normal leading-normal ${styles.text.primary}`}>
                  {index + 1}
                </p>
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`p-4 ${
                    index !== displayData.length - 1
                      ? "border-b border-gray-200 dark:border-neutral-600"
                      : ""
                  }`}
                >
                  <div className={`block font-sans text-sm antialiased font-normal leading-normal ${styles.text.secondary}`}>
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
        <div className="px-6 py-3 text-center border-t rounded-b-xl bg-gray-50 border-gray-200 dark:bg-neutral-700 dark:border-neutral-600">
          <p className={`block font-sans text-sm antialiased font-normal leading-normal opacity-70 ${styles.text.muted}`}>
            最初の{maxRows}件を表示中 (全{data.length}件)
          </p>
        </div>
      )}
    </div>
  );
}
