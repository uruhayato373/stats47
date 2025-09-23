"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  RefreshCw,
  Info,
} from "lucide-react";

interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01?: string;
  item_name?: string;
  unit?: string;
  updated_at: string;
  created_at: string;
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
  const [selectedStatsId, setSelectedStatsId] = useState<string>("");
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [itemNamesLoading, setItemNamesLoading] = useState(false);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      // 新しい効率的なAPIエンドポイントを使用
      const response = await fetch("/api/estat/metainfo/stats-list?limit=100");
      if (response.ok) {
        const data = (await response.json()) as { items?: SavedMetadataItem[] };
        console.log("Fetched stats list:", data.items); // デバッグ用ログ
        setSavedData(data.items || []);
      } else {
        console.error("Failed to fetch stats list: HTTP", response.status);
        setSavedData([]);
      }
    } catch (error) {
      console.error("Failed to fetch stats list:", error);
      setSavedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, []);

  const fetchItemNames = async (statsDataId: string) => {
    setItemNamesLoading(true);
    try {
      const response = await fetch(`/api/estat/metainfo/items?statsDataId=${statsDataId}`);
      if (response.ok) {
        const data = await response.json() as { itemNames?: string[] };
        console.log("Fetched item names:", data.itemNames); // デバッグ用ログ
        setItemNames(data.itemNames || []);
      } else {
        // エラーレスポンスの詳細を取得
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to fetch item names: HTTP", response.status);
        console.error("Error details:", errorData);
        setItemNames([]);
      }
    } catch (error) {
      console.error("Failed to fetch item names:", error);
      setItemNames([]);
    } finally {
      setItemNamesLoading(false);
    }
  };


  const handleStatsIdChange = (statsDataId: string) => {
    setSelectedStatsId(statsDataId);
    if (statsDataId) {
      // 選択されたデータで親コンポーネントに通知
      const selectedItem = savedData.find(
        (item) => item.stats_data_id === statsDataId
      );
      if (selectedItem && onDataSelect) {
        onDataSelect(selectedItem);
      }
      // 項目名リストを取得
      fetchItemNames(statsDataId);
    } else {
      setItemNames([]);
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
            .filter((item) => item.stats_data_id && item.stats_data_id.trim() !== '') // 空文字もチェック
            .sort((a, b) => (a.stats_data_id || '').localeCompare(b.stats_data_id || ''))
            .map((item) => (
              <option key={item.id} value={item.stats_data_id}>
                {item.stats_data_id} - {item.title || '(タイトルなし)'}
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
              const selectedItem = savedData.find(item => item.stats_data_id === selectedStatsId);
              return selectedItem ? (
                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50 dark:bg-neutral-700 p-2 rounded">
                    <div className="font-medium text-gray-900 dark:text-neutral-100 mb-1">
                      {selectedItem.title}
                    </div>
                    <div className="space-y-1 text-gray-600 dark:text-neutral-400">
                      <div>統計表ID: {selectedItem.stats_data_id}</div>
                      <div>統計名: {selectedItem.stat_name}</div>
                      {selectedItem.cat01 && <div>カテゴリ: {selectedItem.cat01}</div>}
                      {selectedItem.item_name && <div>項目名: {selectedItem.item_name}</div>}
                      {selectedItem.unit && <div>単位: {selectedItem.unit}</div>}
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
            <span className="font-medium text-gray-800 dark:text-neutral-200">項目名一覧</span>
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
