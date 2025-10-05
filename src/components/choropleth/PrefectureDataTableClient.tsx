"use client";

import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { SubcategoryData } from "@/types/choropleth";
import { FormattedValue } from "@/lib/estat/types";

type SortField = "rank" | "name" | "value";
type SortOrder = "asc" | "desc";

interface PrefectureDataTableClientProps {
  data: FormattedValue[] | null;
  subcategory: SubcategoryData;
  className?: string;
}

export const PrefectureDataTableClient: React.FC<
  PrefectureDataTableClientProps
> = ({ data, subcategory, className = "" }) => {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ソート処理
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "rank":
          comparison = (a.rank || 0) - (b.rank || 0);
          break;
        case "name":
          comparison = a.areaName.localeCompare(b.areaName);
          break;
        case "value":
          comparison = (a.numericValue || 0) - (b.numericValue || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-3 h-3 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-indigo-600" />
    );
  };

  // 順位に基づく色分け
  const getRankStyle = (rank: number) => {
    if (rank <= 3) return "text-yellow-600 dark:text-yellow-400 font-bold";
    if (rank <= 10) return "text-blue-600 dark:text-blue-400 font-medium";
    return "text-gray-900 dark:text-neutral-100";
  };

  // 値の強調表示
  const getValueStyle = (rank: number) => {
    if (rank <= 3) return "font-bold";
    if (rank <= 5) return "font-medium";
    return "";
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 ${className}`}
      >
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
    <div
      className={`bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 ${className}`}
    >
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            都道府県別データ
          </h3>
          <div className="text-xs text-gray-500 dark:text-neutral-400">
            {sortedData.length}件
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
              <tr>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("rank")}
                >
                  <div className="flex items-center gap-1">
                    順位
                    {getSortIcon("rank")}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    都道府県
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center justify-end gap-1">
                    値{getSortIcon("value")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {sortedData.map((item, index) => (
                <tr
                  key={item.areaCode}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`text-sm ${getRankStyle(
                        item.rank || index + 1
                      )}`}
                    >
                      {item.rank || index + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-neutral-100">
                      {item.areaName}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <span
                      className={`text-sm text-gray-900 dark:text-neutral-100 ${getValueStyle(
                        item.rank || index + 1
                      )}`}
                    >
                      {formatValue(item.numericValue, subcategory)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* フッター */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-700 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-neutral-400">
          <span>単位: {subcategory.unit}</span>
          <span>
            データ種別:{" "}
            {subcategory.dataType === "numerical"
              ? "数値"
              : subcategory.dataType === "percentage"
              ? "割合"
              : "率"}
          </span>
        </div>
      </div>
    </div>
  );
};

// 値のフォーマット関数
function formatValue(
  value: number | null,
  subcategory: SubcategoryData
): string {
  // null または undefined の場合
  if (value === null || value === undefined) {
    return "-";
  }

  const { dataType, unit } = subcategory;

  if (dataType === "percentage") {
    return `${value.toFixed(1)}%`;
  }

  if (unit.includes("円")) {
    return value.toLocaleString("ja-JP");
  }

  if (unit.includes("人") || unit.includes("世帯") || unit.includes("件")) {
    return value.toLocaleString("ja-JP");
  }

  // 小数点以下の桁数を自動調整
  if (value >= 1000) {
    return value.toLocaleString("ja-JP");
  } else if (value >= 10) {
    return value.toFixed(1);
  } else {
    return value.toFixed(2);
  }
}
