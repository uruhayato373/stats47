"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";
import SavedPrefectureRankingList from "./SavedPrefectureRankingList";

interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
}

interface PrefectureRankingSidebarProps {
  className?: string;
  onDataSelect?: (item: SavedMetadataItem) => void;
}

export default function PrefectureRankingSidebar({
  className = "",
  onDataSelect,
}: PrefectureRankingSidebarProps) {
  const [savedData, setSavedData] = useState<SavedMetadataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/estat/metainfo/saved");
      if (response.ok) {
        const data = (await response.json()) as { items?: SavedMetadataItem[] };
        setSavedData(data.items || []);
      } else {
        setSavedData([]);
      }
    } catch (error) {
      console.error("Failed to fetch saved data:", error);
      setSavedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このメタ情報を削除しますか？")) return;

    try {
      const response = await fetch(`/api/estat/metainfo/saved/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedData((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleView = (item: SavedMetadataItem) => {
    if (onDataSelect) {
      onDataSelect(item);
    }
  };

  return (
    <div
      className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-gray-900 dark:text-neutral-100">
            保存済みデータ
          </h3>
        </div>

        <button
          onClick={fetchSavedData}
          disabled={loading}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
          title="更新"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* データリスト */}
      <SavedPrefectureRankingList
        data={savedData}
        loading={loading}
        onView={handleView}
        onDelete={handleDelete}
      />
    </div>
  );
}