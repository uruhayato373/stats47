"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { SavedMetaInfoListItem } from "@/components/organisms/estat-api/meta-info/SavedMetaInfoListItem";
import { Pagination } from "@/components/molecules/Pagination";
import type { EstatMetaInfo } from "@/lib/database/estat/types";

interface EstatMetaInfoSidebarProps {
  className?: string;
  initialData?: EstatMetaInfo[];
  onView?: (item: EstatMetaInfo) => void;
}

export default function EstatMetaInfoSidebar({
  className = "",
  initialData = [],
  onView,
}: EstatMetaInfoSidebarProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleView = (item: EstatMetaInfo) => {
    if (onView) {
      onView(item);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 初期データを直接使用
  const displayData = initialData;

  // ローディング状態の表示（データが空の場合）
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
        </div>

        {/* データなし表示 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Archive className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              保存済みデータがありません
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
      </div>

      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {paginatedData.map((item) => (
            <SavedMetaInfoListItem
              key={item.stats_data_id}
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
