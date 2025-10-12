"use client";

import type { SavedEstatMetainfoItem } from "@/types/models";
import { SavedEstatMetaInfoListItem } from "./components";

interface SavedEstatMetaInfoListProps {
  data: SavedEstatMetainfoItem[];
  loading: boolean;
  onView: (item: SavedEstatMetainfoItem) => void;
  onDelete: (id: string) => void;
}

export default function SavedEstatMetaInfoList({
  data,
  loading,
  onView,
  onDelete,
}: SavedEstatMetaInfoListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
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
    );
  }

  // stats_data_idの昇順でソート（undefinedを考慮）
  const sortedData = [...data].sort((a, b) => {
    const aId = a.stats_data_id || "";
    const bId = b.stats_data_id || "";
    return aId.localeCompare(bId);
  });

  return (
    <>
      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {sortedData.map((item) => (
            <SavedEstatMetaInfoListItem
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
