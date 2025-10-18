"use client";

import React, { useState, useMemo } from "react";
import { useStyles } from "@/hooks/useStyles";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (item: T, index: number) => string | React.ReactNode;
  filterable?: boolean;
  filterType?: 'select' | 'text';
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

  // フィルター状態
  const [filters, setFilters] = useState<Record<string, string>>({});

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true;

        const column = columns.find(col => col.key === key);
        if (!column) return true;

        // 値を取得
        let value: string;
        if (column.render) {
          const rendered = column.render(item, 0);
          value = typeof rendered === 'string' ? rendered : String(rendered);
        } else {
          value = String((item as Record<string, unknown>)[key] || "");
        }

        return value.toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [data, filters, columns]);

  // ユニークな値を取得（セレクトフィルター用）
  const getUniqueValues = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column) return [];

    const values = data.map((item) => {
      if (column.render) {
        const rendered = column.render(item, 0);
        return typeof rendered === 'string' ? rendered : String(rendered);
      } else {
        return String((item as Record<string, unknown>)[columnKey] || "");
      }
    });

    return Array.from(new Set(values)).filter(v => v && v !== "-").sort();
  };

  // フィルター更新
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-8 ${styles.text.muted}`}>
        {emptyMessage}
      </div>
    );
  }

  const displayData = filteredData.slice(0, maxRows);

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
                <div className="space-y-2">
                  <p className={`${styles.table.headerText} ${styles.text.tertiary}`}>
                    {column.label}
                  </p>
                  {column.filterable && (
                    <div className="w-full">
                      {column.filterType === 'select' ? (
                        <select
                          value={filters[column.key] || ''}
                          onChange={(e) => updateFilter(column.key, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
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
                          value={filters[column.key] || ''}
                          onChange={(e) => updateFilter(column.key, e.target.value)}
                          placeholder="フィルター..."
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                        />
                      )}
                    </div>
                  )}
                </div>
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

      {(filteredData.length > maxRows || Object.keys(filters).some(key => filters[key])) && (
        <div className={styles.table.footer}>
          <p className={`${styles.table.footerText} ${styles.text.muted}`}>
            {filteredData.length > maxRows
              ? `最初の${maxRows}件を表示中 (フィルター結果: ${filteredData.length}件 / 全${data.length}件)`
              : `フィルター結果: ${filteredData.length}件 / 全${data.length}件`
            }
          </p>
        </div>
      )}
    </div>
  );
}
