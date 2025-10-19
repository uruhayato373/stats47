"use client";

import { Eye } from "lucide-react";
import type { EstatMetaInfo } from "@/lib/database/estat/types";

interface SavedMetaInfoListItemProps {
  item: EstatMetaInfo;
  onView: (item: EstatMetaInfo) => void;
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

export default SavedMetaInfoListItem;
