"use client";

import { useState, useEffect } from "react";
import { Map, RefreshCw, Eye, Trash2, Calendar, Building2, TrendingUp } from "lucide-react";

interface SavedRankingDataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  categoryCode?: string;
  categoryName?: string;
  areaCode?: string;
  areaName?: string;
  timeCode?: string;
  timeName?: string;
  savedAt: string;
  rankingData?: {
    highest: { prefecture: string; value: string };
    lowest: { prefecture: string; value: string };
    average: string;
  };
}

interface PrefectureRankingSidebarProps {
  className?: string;
  onDataSelect?: (item: SavedRankingDataItem) => void;
}

export default function PrefectureRankingSidebar({
  className = "",
  onDataSelect,
}: PrefectureRankingSidebarProps) {
  const [savedData, setSavedData] = useState<SavedRankingDataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      // TODO: 実際のAPIエンドポイントに合わせて調整
      const response = await fetch("/api/estat/prefecture-ranking/saved");
      if (response.ok) {
        const data = (await response.json()) as { items?: SavedRankingDataItem[] };
        setSavedData(data.items || []);
      } else {
        setSavedData([]);
      }
    } catch (error) {
      console.error("Failed to fetch saved ranking data:", error);
      setSavedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("このランキングデータを削除しますか？")) return;

    try {
      const response = await fetch(`/api/estat/prefecture-ranking/saved/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSavedData((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete ranking data:", error);
    }
  };

  const handleView = (item: SavedRankingDataItem) => {
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
            保存済みランキング
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-indigo-600 rounded-full"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
              読み込み中...
            </p>
          </div>
        ) : savedData.length === 0 ? (
          <div className="p-4 text-center">
            <Map className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              保存済みのランキングデータがありません
            </p>
          </div>
        ) : (
          <div className="p-2">
            {savedData.map((item) => (
              <div
                key={item.id}
                className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors dark:bg-neutral-700 dark:border-neutral-600 dark:hover:bg-neutral-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-neutral-100 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleView(item)}
                      className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-white rounded transition-colors dark:text-neutral-400 dark:hover:text-indigo-400 dark:hover:bg-neutral-800"
                      title="ランキングを表示"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-neutral-800"
                      title="削除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-neutral-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{item.statName}</span>
                  </div>

                  {item.categoryName && (
                    <div className="text-xs text-gray-600 dark:text-neutral-400">
                      カテゴリ: {item.categoryName}
                    </div>
                  )}

                  {item.timeName && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-neutral-400">
                      <Calendar className="w-3 h-3" />
                      <span>{item.timeName}</span>
                    </div>
                  )}

                  {/* ランキング情報 */}
                  {item.rankingData && (
                    <div className="mt-2 p-2 bg-white rounded border dark:bg-neutral-800 dark:border-neutral-600">
                      <div className="text-xs text-gray-700 dark:text-neutral-300 space-y-1">
                        <div className="flex justify-between">
                          <span>最高:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {item.rankingData.highest.prefecture}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>最低:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {item.rankingData.lowest.prefecture}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>平均:</span>
                          <span className="font-medium">
                            {item.rankingData.average}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-neutral-500">
                    保存日: {new Date(item.savedAt).toLocaleDateString("ja-JP")}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-neutral-500 font-mono">
                    ID: {item.statsDataId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}