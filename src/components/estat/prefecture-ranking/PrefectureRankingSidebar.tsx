"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, ChevronDown, ChevronUp, Info, List } from "lucide-react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";

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
  const [selectedStatsId, setSelectedStatsId] = useState<string>("");
  const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

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


  const fetchMetaInfo = async (statsDataId: string) => {
    setMetaLoading(true);
    try {
      const response = await fetch(`/api/estat/metainfo?statsDataId=${statsDataId}`);
      if (response.ok) {
        const data = await response.json() as EstatMetaInfoResponse;
        setMetaInfo(data);
        setShowDetails(true);
        setShowCategories(true);
      } else {
        setMetaInfo(null);
      }
    } catch (error) {
      console.error("Failed to fetch meta info:", error);
      setMetaInfo(null);
    } finally {
      setMetaLoading(false);
    }
  };

  const handleStatsIdChange = (statsDataId: string) => {
    setSelectedStatsId(statsDataId);
    if (statsDataId) {
      fetchMetaInfo(statsDataId);
      // 選択されたデータで親コンポーネントに通知
      const selectedItem = savedData.find(item => item.statsDataId === statsDataId);
      if (selectedItem && onDataSelect) {
        onDataSelect(selectedItem);
      }
    } else {
      setMetaInfo(null);
      setShowDetails(false);
      setShowCategories(false);
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
          {savedData.map((item) => (
            <option key={item.id} value={item.statsDataId}>
              {item.statsDataId} - {item.title}
            </option>
          ))}
        </select>
      </div>

      {/* 詳細情報セクション */}
      {selectedStatsId && (
        <div className="border-b border-gray-200 dark:border-neutral-700">
          {/* 詳細情報 */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800 dark:text-neutral-200">
                  詳細情報
                </span>
              </div>
              {metaLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showDetails && metaInfo && (
              <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="grid grid-cols-1 gap-2 mt-3 text-xs">
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                      統計表名:
                    </span>
                    <span className="text-gray-600 dark:text-neutral-400">
                      {metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.TITLE || "-"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                      政府統計名:
                    </span>
                    <span className="text-gray-600 dark:text-neutral-400">
                      {metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.STAT_NAME || "-"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-neutral-300 w-20 flex-shrink-0">
                      作成機関:
                    </span>
                    <span className="text-gray-600 dark:text-neutral-400">
                      {metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF?.GOV_ORG || "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* カテゴリ一覧 */}
          <div>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-800 dark:text-neutral-200">
                  カテゴリ一覧
                </span>
              </div>
              {showCategories ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showCategories && metaInfo && (
              <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="mt-3 max-h-48 overflow-y-auto">
                  {metaInfo.GET_META_INFO?.METADATA_INF?.CLASS_INF?.CLASS_OBJ ? (
                    <div className="space-y-2">
                      {metaInfo.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ
                        .filter(classObj => classObj["@id"] === "cat01")
                        .map((classObj, index) => {
                          const categories = Array.isArray(classObj.CLASS)
                            ? classObj.CLASS
                            : classObj.CLASS ? [classObj.CLASS] : [];

                          return (
                            <div key={index} className="space-y-1">
                              {categories.slice(0, 10).map((category, catIndex) => (
                                <div
                                  key={catIndex}
                                  className="p-2 bg-gray-50 rounded text-xs dark:bg-neutral-700"
                                >
                                  <div className="font-medium text-gray-900 dark:text-neutral-100">
                                    {category["@name"]}
                                  </div>
                                  <div className="text-gray-500 dark:text-neutral-400">
                                    コード: {category["@code"]}
                                  </div>
                                </div>
                              ))}
                              {categories.length > 10 && (
                                <div className="text-xs text-gray-500 dark:text-neutral-400 text-center">
                                  他 {categories.length - 10} 件
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-neutral-400 text-center py-4">
                      カテゴリ情報がありません
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  );
}