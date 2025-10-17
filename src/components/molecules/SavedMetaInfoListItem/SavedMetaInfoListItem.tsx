"use client";

import { Eye } from "lucide-react";
import type { SavedEstatMetainfoItem } from "@/types/models";

interface SavedMetaInfoListItemProps {
  item: SavedEstatMetainfoItem;
  onView: (item: SavedEstatMetainfoItem) => void;
}

export function SavedMetaInfoListItem({
  item,
  onView,
}: SavedMetaInfoListItemProps) {
  return (
    <div className="py-3 border-b border-dotted border-gray-200 dark:border-neutral-600 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        {/* 左側: メイン情報 */}
        <div className="flex-1 min-w-0 ml-4">
          {/* stats_data_id */}
          <span className="text-xs font-mono text-gray-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">
            {item.stats_data_id}
          </span>
          {/* 政府統計名＞統計標題名 */}
          <div className="text-xs text-gray-700 dark:text-neutral-300 mt-1">
            {item.stat_name}＞{item.title}
          </div>
          {/* ranking_key (optional) */}
          {item.ranking_key && (
            <div className="mt-1">
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                {item.ranking_key}
              </span>
            </div>
          )}
        </div>

        {/* 中央: 項目数 */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 dark:text-neutral-400">
            {item.item_count}件
          </span>
        </div>

        {/* 右側: 詳細ボタン */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => onView(item)}
            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
            title="詳細表示"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
