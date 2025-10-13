"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Map } from "lucide-react";
import { SavedMetadataItem } from "@/types/models";

interface SavedListItemProps {
  item: SavedMetadataItem;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

export default function SavedListItem({
  item,
  onView,
  onDelete,
}: SavedListItemProps) {
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
              title="ランキング表示"
            >
              <Map className="w-4 h-4 inline mr-1" />
              ランキング表示
            </button>
            <button
              onClick={() => onDelete(item.id?.toString() || "")}
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
            {item.cat01 && (
              <div className="flex">
                <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                  カテゴリ:
                </span>
                <span className="text-gray-600 dark:text-neutral-400">
                  {item.cat01}
                </span>
              </div>
            )}
            {item.item_name && (
              <div className="flex">
                <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                  項目名:
                </span>
                <span className="text-gray-600 dark:text-neutral-400">
                  {item.item_name}
                </span>
              </div>
            )}
            {item.unit && (
              <div className="flex">
                <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                  単位:
                </span>
                <span className="text-gray-600 dark:text-neutral-400">
                  {item.unit}
                </span>
              </div>
            )}
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
            <div className="flex">
              <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                保存日時:
              </span>
              <span className="text-gray-600 dark:text-neutral-400">
                {formatDate(item.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
