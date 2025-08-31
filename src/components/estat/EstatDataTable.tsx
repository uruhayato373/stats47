"use client";

import React, { useState } from "react";
import { MapDataPoint } from "@/lib/estat/map-data-service";
import { ChevronDown, ChevronUp, Download, Search } from "lucide-react";

interface EstatDataTableProps {
  dataPoints: MapDataPoint[];
  title?: string;
  className?: string;
}

export const EstatDataTable: React.FC<EstatDataTableProps> = ({
  dataPoints,
  title = "データ一覧",
  className = "",
}) => {
  const [sortField, setSortField] = useState<"prefectureName" | "value">(
    "prefectureName"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 検索フィルタリング
  const filteredData = dataPoints.filter(
    (point) =>
      point.prefectureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.prefectureCode.includes(searchQuery)
  );

  // ソート処理
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    if (sortField === "prefectureName") {
      aValue = a.prefectureName;
      bValue = b.prefectureName;
    } else {
      aValue = a.value ?? 0;
      bValue = b.value ?? 0;
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // ページネーション
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  // ソート処理
  const handleSort = (field: "prefectureName" | "value") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // CSVダウンロード
  const downloadCSV = () => {
    const headers = ["都道府県コード", "都道府県名", "値", "単位"];
    const csvContent = [
      headers.join(","),
      ...dataPoints.map((point) =>
        [
          point.prefectureCode,
          point.prefectureName,
          point.value ?? "",
          point.unit ?? "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `estat-data-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 統計情報
  const validValues = dataPoints
    .filter((point) => point.value !== null)
    .map((point) => point.value!);
  const stats = {
    total: dataPoints.length,
    valid: validValues.length,
    min: validValues.length > 0 ? Math.min(...validValues) : null,
    max: validValues.length > 0 ? Math.max(...validValues) : null,
    mean:
      validValues.length > 0
        ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
        : null,
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700 ${className}`}
    >
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
            {title}
          </h3>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            <Download className="w-4 h-4 mr-2" />
            CSVダウンロード
          </button>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-700 border-b border-gray-200 dark:border-neutral-600">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-neutral-400">総件数:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-neutral-100">
              {stats.total}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-neutral-400">
              有効データ:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-neutral-100">
              {stats.valid}
            </span>
          </div>
          {stats.min !== null && (
            <div>
              <span className="text-gray-500 dark:text-neutral-400">
                最小値:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-neutral-100">
                {stats.min.toLocaleString()}
              </span>
            </div>
          )}
          {stats.max !== null && (
            <div>
              <span className="text-gray-500 dark:text-neutral-400">
                最大値:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-neutral-100">
                {stats.max.toLocaleString()}
              </span>
            </div>
          )}
          {stats.mean !== null && (
            <div>
              <span className="text-gray-500 dark:text-neutral-400">
                平均値:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-neutral-100">
                {stats.mean.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="都道府県名またはコードで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          />
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gray-50 dark:bg-neutral-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                順位
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                onClick={() => handleSort("prefectureName")}
              >
                <div className="flex items-center">
                  都道府県
                  {sortField === "prefectureName" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 w-4 h-4" />
                    ) : (
                      <ChevronDown className="ml-1 w-4 h-4" />
                    ))}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                onClick={() => handleSort("value")}
              >
                <div className="flex items-center">
                  値
                  {sortField === "value" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="ml-1 w-4 h-4" />
                    ) : (
                      <ChevronDown className="ml-1 w-4 h-4" />
                    ))}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-300 uppercase tracking-wider">
                単位
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-800 dark:divide-neutral-700">
            {currentData.map((point, index) => (
              <tr
                key={point.prefectureCode}
                className="hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                  <div>
                    <div className="font-medium">{point.prefectureName}</div>
                    <div className="text-gray-500 dark:text-neutral-400 text-xs">
                      {point.prefectureCode}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                  {point.value !== null ? (
                    <span className="font-mono">{point.displayValue}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-neutral-500">
                      データなし
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                  {point.unit || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-neutral-300">
              {startIndex + 1} - {Math.min(endIndex, sortedData.length)} /{" "}
              {sortedData.length} 件
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600"
              >
                前へ
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
