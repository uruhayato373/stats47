"use client";

import { useState } from "react";
import { Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { SavedEstatMetainfoItem } from "@/types/models";

interface SavedEstatMetaInfoListItemProps {
  item: SavedEstatMetainfoItem;
  onView: (item: SavedEstatMetainfoItem) => void;
  onDelete: (id: string) => void;
}

export function SavedEstatMetaInfoListItem({
  item,
  onView,
  onDelete,
}: SavedEstatMetaInfoListItemProps) {
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
            {item.stats_data_id}
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
              title="詳細表示"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              詳細表示
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

          <div className="grid grid-cols-1 gap-2 text-xs ml-4">
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                政府統計名:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.stat_name}
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
                更新日時:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {formatDate(item.updated_at)}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                作成日時:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {formatDate(item.created_at)}
              </span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                項目数:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {item.item_count}件
              </span>
            </div>
            {item.ranking_key && (
              <div className="flex">
                <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                  ランキング:
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                  {item.ranking_key}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
