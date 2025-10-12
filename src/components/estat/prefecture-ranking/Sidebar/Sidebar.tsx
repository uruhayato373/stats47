"use client";

import { useState } from "react";
import { TrendingUp, RefreshCw, Info } from "lucide-react";
import { useSavedMetadata, useItemNames } from "./hooks";
import { SavedMetadataItem } from "@/types/models";

interface PrefectureRankingSidebarProps {
  className?: string;
  onDataSelect?: (item: SavedMetadataItem) => void;
  initialData?: SavedMetadataItem[];
}

export default function PrefectureRankingSidebar({
  className = "",
  onDataSelect,
  initialData,
}: PrefectureRankingSidebarProps) {
  const [selectedStatsId, setSelectedStatsId] = useState<string>("");
  const { data: savedData, loading, refetch } = useSavedMetadata(initialData);
  const {
    itemNames,
    loading: itemNamesLoading,
    fetchItemNames,
    reset,
  } = useItemNames();

  const handleStatsIdChange = (statsDataId: string) => {
    setSelectedStatsId(statsDataId);
    if (statsDataId) {
      const selectedItem = savedData.find(
        (item) => item.stats_data_id === statsDataId
      );
      if (selectedItem && onDataSelect) {
        onDataSelect(selectedItem);
      }
      fetchItemNames(statsDataId);
    } else {
      reset();
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
          onClick={refetch}
          disabled={loading}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
          title="更新"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 統計表選択セクション */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          統計表を選択
        </label>
        <select
          value={selectedStatsId}
          onChange={(e) => handleStatsIdChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-neutral-900 dark:border-neutral-600 text-gray-900 dark:text-neutral-100"
        >
          <option value="">統計表を選択してください</option>
          {savedData
            .filter(
              (item) => item.stats_data_id && item.stats_data_id.trim() !== ""
            )
            .sort((a, b) =>
              (a.stats_data_id || "").localeCompare(b.stats_data_id || "")
            )
            .map((item) => (
              <option key={item.stats_data_id} value={item.stats_data_id}>
                {item.stats_data_id} - {item.title || "(タイトルなし)"}
              </option>
            ))}
        </select>
      </div>

      {/* 選択された統計表の表示 */}
      {selectedStatsId && (
        <div className="border-b border-gray-200 dark:border-neutral-700 p-4">
          <div className="text-sm text-gray-600 dark:text-neutral-400">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-green-500" />
              <span className="font-medium">選択中の統計表</span>
            </div>
            {(() => {
              const selectedItem = savedData.find(
                (item) => item.stats_data_id === selectedStatsId
              );
              return selectedItem ? (
                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded">
                    <div className="font-medium text-gray-900 dark:text-neutral-100 mb-1">
                      {selectedItem.title}
                    </div>
                    <div className="space-y-1 text-gray-600 dark:text-neutral-400">
                      <div>統計表ID: {selectedItem.stats_data_id}</div>
                      <div>統計名: {selectedItem.stat_name}</div>
                      {selectedItem.cat01 && (
                        <div>カテゴリ: {selectedItem.cat01}</div>
                      )}
                      {selectedItem.item_name && (
                        <div>項目名: {selectedItem.item_name}</div>
                      )}
                      {selectedItem.unit && (
                        <div>単位: {selectedItem.unit}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs bg-gray-50 dark:bg-neutral-700 p-2 rounded">
                  統計表ID: {selectedStatsId}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 項目名リストセクション */}
      {selectedStatsId && (
        <div className="border-b border-gray-200 dark:border-neutral-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-gray-800 dark:text-neutral-200">
              項目名一覧
            </span>
            {itemNamesLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>

          {itemNamesLoading ? (
            <div className="text-xs text-gray-500 dark:text-neutral-400 text-center py-2">
              読み込み中...
            </div>
          ) : itemNames.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {itemNames.map((itemName, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 rounded text-xs dark:bg-neutral-700"
                >
                  <div className="text-gray-900 dark:text-neutral-100">
                    {itemName}
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 dark:text-neutral-400 text-center pt-2">
                合計 {itemNames.length} 項目
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-neutral-400 text-center py-4">
              項目名が見つかりません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
