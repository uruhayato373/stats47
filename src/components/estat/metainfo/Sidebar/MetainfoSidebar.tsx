"use client";

import { Archive, RefreshCw } from "lucide-react";
import SavedEstatMetaInfoList from "./SavedMetaInfoList";
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
  const { data, loading, fetchData, deleteItem } = useMetadataList();

  const handleView = (item: SavedEstatMetainfoItem) => {
    console.log("View metadata:", item);
  };

  // 初期データがある場合はそれを使用、ない場合はフックから取得したデータを使用
  const displayData = initialData.length > 0 ? initialData : data;

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
      <SavedEstatMetaInfoList
        data={displayData}
        loading={loading}
        onView={handleView}
        onDelete={deleteItem}
      />
    </div>
  );
}
