"use client";

import React, { useState, useMemo } from "react";

import { Badge } from "@/components/atoms/ui/badge";
import { Input } from "@/components/atoms/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/molecules/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/organisms/ui/table";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (item: T, index: number) => string | React.ReactNode;
  filterable?: boolean;
  filterType?: "select" | "text";
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
  // フィルター状態
  const [filters, setFilters] = useState<Record<string, string>>({});

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true;

        const column = columns.find((col) => col.key === key);
        if (!column) return true;

        // 値を取得
        let value: string;
        if (column.render) {
          const rendered = column.render(item, 0);
          value = typeof rendered === "string" ? rendered : String(rendered);
        } else {
          value = String((item as Record<string, unknown>)[key] || "");
        }

        return value.toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters, columns]);

  // ユニークな値を取得（セレクトフィルター用）
  const getUniqueValues = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column) return [];

    const values = data.map((item) => {
      if (column.render) {
        const rendered = column.render(item, 0);
        return typeof rendered === "string" ? rendered : String(rendered);
      } else {
        return String((item as Record<string, unknown>)[columnKey] || "");
      }
    });

    return Array.from(new Set(values))
      .filter((v) => v && v !== "-")
      .sort();
  };

  // フィルター更新
  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const displayData = filteredData.slice(0, maxRows);

  return (
    <div className="overflow-hidden bg-card border border-border rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
        <thead className="bg-gray-50 dark:bg-neutral-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              インデックス
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider"
              >
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                    {column.label}
                  </p>
                  {column.filterable && (
                    <div className="w-full">
                      {column.filterType === "select" ? (
                        <select
                          value={filters[column.key] || ""}
                          onChange={(e) =>
                            updateFilter(column.key, e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-ring focus:border-primary dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                        >
                          <option value="">すべて</option>
                          {getUniqueValues(column.key).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={filters[column.key] || ""}
                          onChange={(e) =>
                            updateFilter(column.key, e.target.value)
                          }
                          placeholder="フィルター..."
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-ring focus:border-primary dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                        />
                      )}
                    </div>
                  )}
                </div>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-200">
                {index + 1}
              </td>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-200"
                >
                  <div>
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

      {(filteredData.length > maxRows ||
        Object.keys(filters).some((key) => filters[key])) && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 dark:bg-neutral-900 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {filteredData.length > maxRows
              ? `最初の${maxRows}件を表示中 (フィルター結果: ${filteredData.length}件 / 全${data.length}件)`
              : `フィルター結果: ${filteredData.length}件 / 全${data.length}件`}
          </p>
        </div>
      )}
    </div>
  );
}
