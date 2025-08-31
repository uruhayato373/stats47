"use client";

import { useState } from "react";
import { RefreshCw, Database, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EstatDataFetcher from "@/components/estat/EstatDataFetcher";
import EstatDataDisplay from "@/components/estat/EstatDataDisplay";
import { EstatStatsDataResponse, GetStatsDataParams } from "@/types/estat";

export default function EstatDataPage() {
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<GetStatsDataParams | null>(
    null
  );

  const handleFetchData = async (params: GetStatsDataParams) => {
    setLoading(true);
    setError(null);
    setCurrentParams(params);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/estat/data?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as EstatStatsDataResponse;
      setApiResponse(data);
    } catch (err) {
      console.error("Data fetch error:", err);
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
      setApiResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentParams) {
      handleFetchData(currentParams);
    }
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {/* ヘッダーセクション */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                e-STAT データ取得・確認
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                e-Stat APIから統計データを取得してレスポンスを確認できます
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-x-2">
              {currentParams && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? "更新中..." : "更新"}
                </button>
              )}

              <a
                href="https://www.e-stat.go.jp/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                e-STAT API
              </a>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="p-4 bg-white dark:bg-neutral-900">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* データ取得フォーム */}
              <EstatDataFetcher onSubmit={handleFetchData} loading={loading} />

              {/* データ表示エリア */}
              <EstatDataDisplay
                data={apiResponse}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
