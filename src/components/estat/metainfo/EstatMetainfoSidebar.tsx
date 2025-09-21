"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  Search,
  Calendar,
  Building2,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  X,
} from "lucide-react";

interface SavedMetadataItem {
  id: string;
  statsDataId: string;
  title: string;
  statName: string;
  govOrg: string;
  surveyDate: string;
  savedAt: string;
}

interface EstatMetainfoSidebarProps {
  className?: string;
}

export default function EstatMetainfoSidebar({
  className = "",
}: EstatMetainfoSidebarProps) {
  const [savedData, setSavedData] = useState<SavedMetadataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const itemsPerPage = 10;
  const filteredData = savedData.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.govOrg.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const fetchSavedData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/estat/metainfo/saved");
      if (response.ok) {
        const data = await response.json();
        setSavedData(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch saved data:", error);
      // フォールバック用のモックデータ
      setSavedData([
        {
          id: "1",
          statsDataId: "0003348423",
          title: "令和2年国勢調査 人口等基本集計",
          statName: "国勢調査",
          govOrg: "総務省",
          surveyDate: "2020-10-01",
          savedAt: "2024-01-15T10:30:00Z",
        },
        {
          id: "2",
          statsDataId: "0003412345",
          title: "令和5年住宅・土地統計調査",
          statName: "住宅・土地統計調査",
          govOrg: "総務省",
          surveyDate: "2023-10-01",
          savedAt: "2024-01-14T15:20:00Z",
        },
      ]);
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
    // メタ情報の詳細を表示する機能（今後実装）
    console.log("View metadata:", item);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isCollapsed) {
    return (
      <div
        className={`w-12 bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700 ${className}`}
      >
        <div className="p-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title="サイドバーを展開"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full xl:w-80 bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700 flex flex-col ${className}`}
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

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSavedData}
            disabled={loading}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title="更新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            title="サイドバーを折りたたむ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 検索 */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="タイトル、統計名で検索..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
          />
        </div>
      </div>

      {/* サマリー */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 text-sm text-gray-600 dark:text-neutral-400">
        {filteredData.length > 0
          ? `${filteredData.length}件のデータ`
          : "データがありません"}
      </div>

      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              読み込み中...
            </p>
          </div>
        ) : currentData.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-neutral-700">
            {currentData.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <div className="space-y-2">
                  {/* タイトル */}
                  <h4 className="text-sm font-medium text-gray-900 dark:text-neutral-100 line-clamp-2">
                    {item.title}
                  </h4>

                  {/* 統計名 */}
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-neutral-400">
                    <FileText className="w-3 h-3" />
                    <span className="truncate">{item.statName}</span>
                  </div>

                  {/* 政府機関 */}
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-neutral-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{item.govOrg}</span>
                  </div>

                  {/* 日付情報 */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-500">
                    <Calendar className="w-3 h-3" />
                    <span>保存: {formatDate(item.savedAt)}</span>
                  </div>

                  {/* アクション */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-neutral-500">
                      ID: {item.statsDataId}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(item)}
                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors dark:text-neutral-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
                        title="詳細を表示"
                      >
                        <Eye className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                        title="削除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-neutral-400">
            <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchQuery
                ? "検索結果がありません"
                : "保存済みデータがありません"}
            </p>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-neutral-400">
              {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredData.length)} /{" "}
              {filteredData.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs text-gray-600 dark:text-neutral-400 px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
