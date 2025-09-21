"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Database, ExternalLink } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import {
  EstatDataFetcher,
  EstatDataDisplay,
} from "@/components/estat/statsdata";
import { EstatStatsDataResponse, GetStatsDataParams } from "@/lib/estat/types";

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

      const response = await fetch(
        `/api/estat/data?${queryParams.toString()}`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          const textResponse = await response.text();
          console.error("Raw error response:", textResponse);
          errorMessage = `HTTP ${response.status}: ${textResponse.substring(
            0,
            100
          )}`;
        }
        throw new Error(errorMessage);
      }

      let data: EstatStatsDataResponse;
      try {
        const responseText = await response.text();
        console.log("Raw API response:", responseText.substring(0, 200));
        data = JSON.parse(responseText) as EstatStatsDataResponse;
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        const responseText = await response.text();
        console.error("Raw response that failed to parse:", responseText);
        throw new Error(
          `Invalid JSON response: ${
            jsonError instanceof Error ? jsonError.message : "Unknown error"
          }`
        );
      }

      setApiResponse(data);
    } catch (err) {
      console.error("Data fetch error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "リクエストがタイムアウトしました。e-STAT APIが応答していない可能性があります。"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "データ取得に失敗しました"
        );
      }
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
