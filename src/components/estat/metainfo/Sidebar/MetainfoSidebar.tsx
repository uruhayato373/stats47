"use client";

import { useState } from "react";
import { Archive, RefreshCw } from "lucide-react";
import { SavedEstatMetaInfoListItem, Pagination } from "./components";
import { useMetadataList } from "../hooks/useMetadataList";
import type { SavedEstatMetainfoItem } from "@/types/models";

interface EstatMetaInfoSidebarProps {
  className?: string;
  initialData?: SavedEstatMetainfoItem[];
}

export default function EstatMetaInfoSidebar({
  className = "",
  initialData = [],
}: EstatMetaInfoSidebarProps) {
  const { data, loading, fetchData } = useMetadataList();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleView = (item: SavedEstatMetainfoItem) => {
    console.log("View metadata:", item);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 初期データがある場合はそれを使用、ない場合はフックから取得したデータを使用
  const displayData = initialData.length > 0 ? initialData : data;

  // ローディング状態の表示
  if (loading) {
    return (
      <div
        className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
        style={{ minHeight: "400px" }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600" />
            <h3 className="font-medium text-gray-900 dark:text-neutral-100">
              保存済みデータ
            </h3>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title="更新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ローディング表示 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              読み込み中...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // データが空の場合の表示
  if (displayData.length === 0) {
    return (
      <div
        className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
        style={{ minHeight: "400px" }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600" />
            <h3 className="font-medium text-gray-900 dark:text-neutral-100">
              保存済みデータ
            </h3>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title="更新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* 空状態表示 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-neutral-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              保存済みデータがありません
            </p>
          </div>
        </div>
      </div>
    );
  }

  // stats_data_idの昇順でソート（undefinedを考慮）
  const sortedData = [...displayData].sort((a, b) => {
    const aId = a.stats_data_id || "";
    const bId = b.stats_data_id || "";
    return aId.localeCompare(bId);
  });

  // ページネーション計算
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // データが変更されたらページを1にリセット
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <div
      className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-gray-900 dark:text-neutral-100">
            保存済みデータ
          </h3>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
          title="更新"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {paginatedData.map((item) => (
            <SavedEstatMetaInfoListItem
              key={item.id}
              item={item}
              onView={handleView}
            />
          ))}
        </div>
      </div>

      {/* ページネーション */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
