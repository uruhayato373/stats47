"use client";

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpDown, Download } from 'lucide-react';
import { ChoroplethDataPoint } from '@/types/choropleth';
import { useStyles } from '@/hooks/useStyles';

interface PrefectureDataTableProps {
  data: ChoroplethDataPoint[];
  unit: string;
  dataType: 'numerical' | 'percentage' | 'rate';
  className?: string;
  onDownload?: () => void;
}

type SortField = 'rank' | 'name' | 'value';
type SortOrder = 'asc' | 'desc';

export const PrefectureDataTable: React.FC<PrefectureDataTableProps> = ({
  data,
  unit,
  dataType,
  className = "",
  onDownload,
}) => {
  const styles = useStyles();
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // ソート処理
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'name':
          comparison = a.prefectureName.localeCompare(b.prefectureName, 'ja');
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  // ソート変更ハンドラー
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'value' ? 'desc' : 'asc'); // 値の場合は降順をデフォルト
    }
  };

  // ソートアイコン表示
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <TrendingUp className="w-4 h-4 text-indigo-600" />
      : <TrendingDown className="w-4 h-4 text-indigo-600" />;
  };

  // 順位の色分け
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 font-bold';
    if (rank === 2) return 'text-gray-500 font-bold';
    if (rank === 3) return 'text-orange-600 font-bold';
    if (rank <= 5) return 'text-indigo-600 font-medium';
    return 'text-gray-900 dark:text-neutral-100';
  };

  // 値の強調表示
  const getValueStyle = (rank: number) => {
    if (rank <= 3) return 'font-bold';
    if (rank <= 5) return 'font-medium';
    return '';
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`${styles.card.base} ${className}`}>
        <div className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-neutral-400">
            表示するデータがありません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card.base} ${className}`}>
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className={`${styles.heading.md} flex items-center gap-2`}>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            都道府県別ランキング
          </h3>
          {onDownload && (
            <button
              onClick={onDownload}
              className={`${styles.button.secondary} flex items-center gap-2`}
              title="データをダウンロード"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ダウンロード</span>
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
          全{data.length}都道府県のデータ • 単位: {unit}
        </p>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
            <tr>
              <th
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-neutral-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => handleSort('rank')}
              >
                <div className="flex items-center gap-2">
                  順位
                  {getSortIcon('rank')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-900 dark:text-neutral-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  都道府県
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-right font-medium text-gray-900 dark:text-neutral-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center justify-end gap-2">
                  値
                  {getSortIcon('value')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-neutral-100">
                単位
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
            {sortedData.map((item) => (
              <tr
                key={item.prefectureCode}
                className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {/* 順位 */}
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-2 ${getRankColor(item.rank)}`}>
                    {item.rank <= 3 && (
                      <span className="text-lg">
                        {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    <span className={getRankColor(item.rank)}>
                      {item.rank}位
                    </span>
                  </div>
                </td>

                {/* 都道府県名 */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-neutral-100">
                    {item.prefectureName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-neutral-500">
                    コード: {item.prefectureCode}
                  </div>
                </td>

                {/* 値 */}
                <td className="px-4 py-3 text-right">
                  <div className={`font-mono text-gray-900 dark:text-neutral-100 ${getValueStyle(item.rank)}`}>
                    {item.displayValue}
                  </div>
                  {dataType === 'numerical' && (
                    <div className="text-xs text-gray-500 dark:text-neutral-500">
                      {item.value.toLocaleString()}
                    </div>
                  )}
                </td>

                {/* 単位 */}
                <td className="px-4 py-3 text-gray-600 dark:text-neutral-400">
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* フッター統計 */}
      <div className="p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-neutral-100">
              {data.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">総数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-indigo-600">
              {data[0]?.displayValue || '-'}
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">最高値</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {data[data.length - 1]?.displayValue || '-'}
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">最低値</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">
              {data.length > 0
                ? Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length).toLocaleString()
                : '-'
              }
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">平均値</div>
          </div>
        </div>
      </div>
    </div>
  );
};