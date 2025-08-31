"use client";

import { useState, useEffect } from "react";
import { useStyles } from "@/hooks/useStyles";
import {
  Database,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react";

interface EstatMetadata {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  category_count: number;
  created_at: string;
  updated_at: string;
}

export default function EstatMetadataDisplay() {
  const [metadata, setMetadata] = useState<EstatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const styles = useStyles();

  useEffect(() => {
    console.log("EstatMetadataDisplay: useEffect triggered");
    fetchEstatMetadata();
  }, []);

  const fetchEstatMetadata = async () => {
    try {
      console.log("EstatMetadataDisplay: fetchEstatMetadata started");
      setLoading(true);
      setError("");

      // Cloudflare D1からデータを取得
      const response = await fetch("/api/estat/metadata/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "EstatMetadataDisplay: API response status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(`データの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      console.log("EstatMetadataDisplay: API response data:", data);

      // データが配列であることを確認
      if (Array.isArray(data)) {
        console.log(
          "EstatMetadataDisplay: Setting metadata array, length:",
          data.length
        );
        setMetadata(data);
      } else if (
        data &&
        typeof data === "object" &&
        "metadata" in data &&
        Array.isArray(data.metadata)
      ) {
        console.log(
          "EstatMetadataDisplay: Setting metadata from object, length:",
          data.metadata.length
        );
        setMetadata(data.metadata);
      } else if (data && typeof data === "object" && "error" in data) {
        throw new Error(String(data.error));
      } else {
        console.warn("EstatMetadataDisplay: 予期しないデータ形式:", data);
        setMetadata([]);
      }
    } catch (err) {
      console.error("EstatMetadataDisplay: データ取得エラー:", err);
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
      setMetadata([]); // エラー時は空配列を設定
    } finally {
      setLoading(false);
      console.log(
        "EstatMetadataDisplay: fetchEstatMetadata completed, loading set to false"
      );
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const downloadCSV = () => {
    if (metadata.length === 0) return;

    const headers = [
      "ID",
      "統計表ID",
      "統計名",
      "タイトル",
      "カテゴリ数",
      "作成日時",
      "更新日時",
    ];
    const csvContent = [
      headers.join(","),
      ...metadata.map((item) =>
        [
          item.id,
          item.stats_data_id,
          item.stat_name,
          item.title,
          item.category_count,
          item.created_at,
          item.updated_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `estat-metadata-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // ページネーション計算
  const totalPages = Math.ceil(metadata.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = metadata.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-neutral-400">
            データを読み込み中...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700">
        <p className="text-red-800 dark:text-red-200">エラー: {error}</p>
        <button
          onClick={fetchEstatMetadata}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  console.log(
    "EstatMetadataDisplay: Rendering component, metadata length:",
    metadata.length,
    "loading:",
    loading,
    "error:",
    error
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              e-STAT メタデータ一覧
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEstatMetadata}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              title="更新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={downloadCSV}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
              title="CSVダウンロード"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-800 dark:text-neutral-200 font-medium">
          {metadata.length}件のメタデータ
        </div>
      </div>

      {/* データ表示 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        {metadata.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
            保存されたメタデータがありません。
            <br />
            メタ情報保存タブでデータを保存してください。
          </div>
        ) : (
          <div className="space-y-3">
            {currentData.map((item, index) => {
              // item.idが存在しない場合はスキップ
              if (item.id === undefined || item.id === null) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.stat_name}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.category_count}件
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {item.stats_data_id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">
                          {formatDate(item.updated_at)}
                        </span>
                        {expandedItems.has(item.id) ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <BarChart3 className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedItems.has(item.id) && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="pt-3 space-y-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            タイトル:
                          </span>
                          <p className="text-sm text-gray-900 mt-1">
                            {item.title}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">作成日時:</span>
                            <p className="text-gray-900 mt-1">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">更新日時:</span>
                            <p className="text-gray-900 mt-1">
                              {formatDate(item.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  {startIndex + 1} - {Math.min(endIndex, metadata.length)} /{" "}
                  {metadata.length} 件
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
