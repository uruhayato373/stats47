"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Map } from "lucide-react";

interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
}

interface SavedPrefectureRankingItemProps {
  item: SavedMetadataItem;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

interface SavedPrefectureRankingListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

// 個別のランキングデータアイテムコンポーネント
function SavedPrefectureRankingItem({
  item,
  onView,
  onDelete,
}: SavedPrefectureRankingItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="py-3 border-b border-gray-200 dark:border-neutral-600 last:border-b-0">
      {/* メイン情報行 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 ml-4">
          <span className="text-xs font-mono text-gray-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">
            {item.statsDataId}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title={isExpanded ? "折りたたむ" : "詳細を表示"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 展開された詳細情報 */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-600">
          {/* アクションボタン */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onView(item)}
              className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
              title="ランキング表示"
            >
              <Map className="w-4 h-4 inline mr-1" />
              ランキング表示
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              title="削除"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              削除
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                政府統計名:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.statName}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                統計表題名:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.title}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                作成機関:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.govOrg}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                調査年月:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.surveyDate}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                保存日時:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {formatDate(item.savedAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedPrefectureRankingList({
  data,
  loading,
  onView,
  onDelete,
}: SavedPrefectureRankingListProps) {
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
          <Map className="w-12 h-12" />
        </div>
        <p className="text-sm">保存済みデータがありません</p>
        <p className="text-xs mt-1">
          メタ情報ページでデータを保存すると、ここに表示されます
        </p>
      </div>
    );
  }

  // statsDataIdの昇順でソート
  const sortedData = [...data].sort((a, b) =>
    a.statsDataId.localeCompare(b.statsDataId)
  );

  return (
    <>
      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {sortedData.map((item) => (
            <SavedPrefectureRankingItem
              key={item.id}
              item={item}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </>
  );
}
