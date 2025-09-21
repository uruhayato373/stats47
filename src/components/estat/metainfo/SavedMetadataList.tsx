"use client";

import { useState } from "react";
import {
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
}

interface SavedMetadataItemProps {
  item: SavedMetadataItem;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

interface SavedMetadataListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

// 個別のメタデータアイテムコンポーネント
function SavedMetadataItem({ item, onView, onDelete }: SavedMetadataItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-shadow">
      {/* ヘッダー（クリック可能） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate flex-1 min-w-0">
            {item.statName} - {item.title}
          </h4>
          <div className="ml-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* 展開された内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="pt-4 space-y-3">
            {/* 詳細情報 */}
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  統計表ID:
                </span>
                <span className="ml-2 font-mono text-gray-600 dark:text-neutral-400">
                  {item.statsDataId}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  政府統計名:
                </span>
                <span className="ml-2 text-gray-600 dark:text-neutral-400">
                  {item.statName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  統計表題名:
                </span>
                <span className="ml-2 text-gray-600 dark:text-neutral-400">
                  {item.title}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  作成機関:
                </span>
                <span className="ml-2 text-gray-600 dark:text-neutral-400">
                  {item.govOrg}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  調査年月:
                </span>
                <span className="ml-2 text-gray-600 dark:text-neutral-400">
                  {item.surveyDate}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-neutral-300">
                  保存日時:
                </span>
                <span className="ml-2 text-gray-600 dark:text-neutral-400">
                  {formatDate(item.savedAt)}
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={() => onView(item)}
                className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                詳細表示
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedMetadataList({
  data,
  loading,
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  onPageChange,
  onView,
  onDelete,
}: SavedMetadataListProps) {
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2">
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          読み込み中...
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
        <div className="w-12 h-12 mx-auto mb-3 opacity-50">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
        <p className="text-sm">保存済みデータがありません</p>
      </div>
    );
  }

  return (
    <>
      {/* データリスト */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {data.map((item) => (
            <SavedMetadataItem
              key={item.id}
              item={item}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-neutral-400">
              {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, data.length)} / {data.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs text-gray-600 dark:text-neutral-400 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
