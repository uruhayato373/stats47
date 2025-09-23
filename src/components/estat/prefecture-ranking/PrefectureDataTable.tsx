"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Table as TableIcon } from "lucide-react";
import { FormattedValue } from "@/lib/estat/types";

interface PrefectureDataTableProps {
  data: FormattedValue[];
  className?: string;
}

type SortField = 'rank' | 'prefecture' | 'value';
type SortDirection = 'asc' | 'desc';

export default function PrefectureDataTable({
  data,
  className = "",
}: PrefectureDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // データをソートしてランキングを計算
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 有効なデータのみを抽出してランキング用にソート（値の降順）
    const validData = data.filter(item => item.numericValue !== null && item.numericValue !== 0);
    const rankedData = [...validData]
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    // ユーザー指定のソートを適用
    return rankedData.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'rank':
          compareValue = a.rank - b.rank;
          break;
        case 'prefecture':
          compareValue = (a.areaName || '').localeCompare(b.areaName || '');
          break;
        case 'value':
          compareValue = (a.numericValue || 0) - (b.numericValue || 0);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc'); // ランクは昇順、その他は降順がデフォルト
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-indigo-600" />
      : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('ja-JP');
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <TableIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>表示するデータがありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-indigo-600" />
          都道府県ランキング表
          <span className="text-sm text-gray-500">({sortedData.length}件)</span>
        </h3>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-neutral-700">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-600"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-1">
                  順位
                  {getSortIcon('rank')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-600"
                onClick={() => handleSort('prefecture')}
              >
                <div className="flex items-center gap-1">
                  都道府県
                  {getSortIcon('prefecture')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-600"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center justify-end gap-1">
                  値
                  {getSortIcon('value')}
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-neutral-400">
                表示値
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-800 dark:divide-neutral-700">
            {sortedData.map((item, index) => (
              <tr
                key={`${item.areaCode}-${item.categoryCode}-${item.timeCode}`}
                className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                      ${item.rank <= 3
                        ? item.rank === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.rank === 2
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                      }
                    `}>
                      {item.rank}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                    {item.areaName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    {item.areaCode}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="text-sm font-mono text-gray-900 dark:text-neutral-100">
                    {item.numericValue ? formatNumber(item.numericValue) : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900 dark:text-neutral-100">
                    {item.displayValue || '-'}
                  </div>
                  {item.unit && (
                    <div className="text-xs text-gray-500 dark:text-neutral-400">
                      {item.unit}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* フッター統計 */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 dark:bg-neutral-700 dark:border-neutral-600">
        <div className="flex justify-between text-sm text-gray-600 dark:text-neutral-400">
          <div>
            データ数: {sortedData.length}件
          </div>
          <div className="space-x-4">
            {sortedData.length > 0 && (
              <>
                <span>
                  最大値: {formatNumber(Math.max(...sortedData.map(item => item.numericValue || 0)))}
                </span>
                <span>
                  最小値: {formatNumber(Math.min(...sortedData.map(item => item.numericValue || 0)))}
                </span>
                <span>
                  平均値: {formatNumber(
                    Math.round(
                      sortedData.reduce((sum, item) => sum + (item.numericValue || 0), 0) / sortedData.length
                    )
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}