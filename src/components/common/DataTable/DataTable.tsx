"use client";

import React from "react";

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
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
        {emptyMessage}
      </div>
    );
  }

  const displayData = data.slice(0, maxRows);

  return (
    <div className="relative flex flex-col w-full h-full overflow-scroll text-gray-700 bg-white shadow-md rounded-xl bg-clip-border dark:bg-neutral-800 dark:text-neutral-300">
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-b border-blue-gray-100 bg-blue-gray-50 dark:border-neutral-600 dark:bg-neutral-700">
              <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70 dark:text-neutral-300">
                インデックス
              </p>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="p-4 border-b border-blue-gray-100 bg-blue-gray-50 dark:border-neutral-600 dark:bg-neutral-700"
              >
                <p className="block font-sans text-sm antialiased font-normal leading-none text-blue-gray-900 opacity-70 dark:text-neutral-300">
                  {column.label}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((item, index) => (
            <tr key={index}>
              <td className={`p-4 ${index !== displayData.length - 1 ? 'border-b border-blue-gray-50 dark:border-neutral-600' : ''}`}>
                <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900 dark:text-neutral-100">
                  {index + 1}
                </p>
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`p-4 ${index !== displayData.length - 1 ? 'border-b border-blue-gray-50 dark:border-neutral-600' : ''}`}
                >
                  <div className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900 dark:text-neutral-100">
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
        <div className="px-6 py-3 bg-blue-gray-50 dark:bg-neutral-700 text-center border-t border-blue-gray-100 dark:border-neutral-600 rounded-b-xl">
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-blue-gray-900 opacity-70 dark:text-neutral-400">
            最初の{maxRows}件を表示中 (全{data.length}件)
          </p>
        </div>
      )}
    </div>
  );
}
