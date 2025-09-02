"use client";

import React from "react";

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (item: T, index: number) => string | React.ReactNode;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage: string;
  maxRows?: number;
}

export default function DataTable<T = any>({ 
  data, 
  columns, 
  emptyMessage, 
  maxRows = 100 
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
        {emptyMessage}
      </div>
    );
  }

  const displayData = data.slice(0, maxRows);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
        <thead className="bg-gray-50 dark:bg-neutral-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
              インデックス
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-neutral-300 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-800 dark:divide-neutral-700">
          {displayData.map((item, index) => (
            <tr
              key={index}
              className="hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-neutral-100">
                {index + 1}
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100"
                >
                  {column.render ? column.render(item, index) : (item as any)[column.key] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > maxRows && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-neutral-700 text-center">
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            最初の{maxRows}件を表示中 (全{data.length}件)
          </p>
        </div>
      )}
    </div>
  );
}