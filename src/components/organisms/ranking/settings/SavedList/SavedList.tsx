"use client";

import { Map } from "lucide-react";
import { SavedListItem } from "./components";
import { SavedMetadataItem } from "@/lib/estat-api/types/meta-info";

interface SavedListProps {
  data: SavedMetadataItem[];
  loading: boolean;
  onView: (item: SavedMetadataItem) => void;
  onDelete: (id: string) => void;
}

export default function SavedList({
  data,
  loading,
  onView,
  onDelete,
}: SavedListProps) {
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

  // stats_data_idの昇順でソート
  const sortedData = [...data].sort((a, b) =>
    a.stats_data_id.localeCompare(b.stats_data_id)
  );

  return (
    <>
      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {sortedData.map((item) => (
            <SavedListItem
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
