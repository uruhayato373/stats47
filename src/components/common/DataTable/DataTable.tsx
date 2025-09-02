"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div
        className={`text-center py-8 ${
          theme === "dark" ? "text-neutral-400" : "text-gray-500"
        }`}
      >
        {emptyMessage}
      </div>
    );
  }

  const displayData = data.slice(0, maxRows);

  return (
    <div
      className={`relative flex flex-col w-full h-full overflow-scroll shadow-md rounded-xl bg-clip-border ${
        theme === "dark"
          ? "text-neutral-300 bg-neutral-800"
          : "text-gray-700 bg-white"
      }`}
    >
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th
              className={`p-4 border-b ${
                theme === "dark"
                  ? "border-neutral-600 bg-neutral-700"
                  : "border-blue-gray-100 bg-blue-gray-50"
              }`}
            >
              <p
                className={`block font-sans text-sm antialiased font-normal leading-none opacity-70 ${
                  theme === "dark" ? "text-neutral-300" : "text-blue-gray-900"
                }`}
              >
                インデックス
              </p>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`p-4 border-b ${
                  theme === "dark"
                    ? "border-neutral-600 bg-neutral-700"
                    : "border-blue-gray-100 bg-blue-gray-50"
                }`}
              >
                <p
                  className={`block font-sans text-sm antialiased font-normal leading-none opacity-70 ${
                    theme === "dark" ? "text-neutral-300" : "text-blue-gray-900"
                  }`}
                >
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
                    ? `border-b ${
                        theme === "dark"
                          ? "border-neutral-600"
                          : "border-blue-gray-50"
                      }`
                    : ""
                }`}
              >
                <p
                  className={`block font-sans text-sm antialiased font-normal leading-normal ${
                    theme === "dark" ? "text-neutral-100" : "text-blue-gray-900"
                  }`}
                >
                  {index + 1}
                </p>
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`p-4 ${
                    index !== displayData.length - 1
                      ? `border-b ${
                          theme === "dark"
                            ? "border-neutral-600"
                            : "border-blue-gray-50"
                        }`
                      : ""
                  }`}
                >
                  <div
                    className={`block font-sans text-sm antialiased font-normal leading-normal ${
                      theme === "dark"
                        ? "text-neutral-100"
                        : "text-blue-gray-900"
                    }`}
                  >
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
        <div
          className={`px-6 py-3 text-center border-t rounded-b-xl ${
            theme === "dark"
              ? "bg-neutral-700 border-neutral-600"
              : "bg-blue-gray-50 border-blue-gray-100"
          }`}
        >
          <p
            className={`block font-sans text-sm antialiased font-normal leading-normal opacity-70 ${
              theme === "dark" ? "text-neutral-400" : "text-blue-gray-900"
            }`}
          >
            最初の{maxRows}件を表示中 (全{data.length}件)
          </p>
        </div>
      )}
    </div>
  );
}
