"use client";

import React, { useState } from "react";
import { Database, ExternalLink, Map } from "lucide-react";
import { ChoroplethMap } from "@/components/estat/visualization";
import { EstatDataFetcher } from "@/components/estat/data";
import { EstatDataFormatter } from "@/lib/estat/response/EstatDataFormatter";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { EstatStatsDataResponse, GetStatsDataParams } from "@/types/estat";

export default function ChoroplethPage() {
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<any>(null);

  const handleFetchData = async (params: GetStatsDataParams) => {
    setLoading(true);
    setError(null);
    setDataset(null);

    try {
      console.log("=== データ取得開始 ===");
      console.log("パラメータ:", params);

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/estat/data?${queryParams.toString()}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
          errorMessage = `HTTP ${response.status}: ${textResponse.substring(0, 100)}`;
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

      // EstatDataFormatterで変換してconsole.logに出力
      console.log("=== データ変換開始 ===");
      const formattedData = EstatDataFormatter.formatStatsData(data);

      console.log("=== EstatDataFormatter変換結果 ===");
      console.log("1. Table Info:", formattedData.tableInfo);
      console.log("2. Areas:", formattedData.areas);
      console.log("3. Categories:", formattedData.categories);
      console.log("4. Years:", formattedData.years);
      console.log("5. Values (最初の10件):", formattedData.values.slice(0, 10));
      console.log("6. Metadata:", formattedData.metadata);
      console.log("7. 全体統計:");
      console.log("   - 地域数:", formattedData.areas.length);
      console.log("   - カテゴリ数:", formattedData.categories.length);
      console.log("   - 年度数:", formattedData.years.length);
      console.log("   - 値の総数:", formattedData.values.length);
      console.log("   - 有効な値:", formattedData.metadata.validValues);
      console.log("   - NULL値:", formattedData.metadata.nullValues);
      console.log("============================");

      // ChoroplethMapが期待する形式に変換
      console.log("=== コロプレス地図用データセット作成 ===");
      const dataPoints = formattedData.values.map((value) => ({
        prefectureCode: value.areaCode || "",
        prefectureName: value.areaInfo?.displayName || value.areaCode || "",
        value: value.numericValue || 0,
        displayValue: value.displayValue,
        unit: value.unit,
      }));

      // 統計情報を計算
      const validDataPoints = dataPoints.filter(dp => dp.value !== 0 && dp.value !== null);
      const values = validDataPoints.map(dp => dp.value);

      const choroplethDataset = {
        title: formattedData.tableInfo.title || formattedData.tableInfo.statName,
        statName: formattedData.tableInfo.statName,
        dataPoints,
        summary: {
          totalCount: dataPoints.length,
          validCount: validDataPoints.length,
          min: values.length > 0 ? Math.min(...values) : null,
          max: values.length > 0 ? Math.max(...values) : null,
          average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
        },
      };

      console.log("データセット概要:", {
        statName: choroplethDataset.statName,
        dataPointsCount: choroplethDataset.dataPoints.length,
        summary: choroplethDataset.summary,
      });
      console.log("=== データセット作成完了 ===");

      setDataset(choroplethDataset);
    } catch (err) {
      console.error("Data fetch error:", err);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError("リクエストがタイムアウトしました。e-STAT APIが応答していない可能性があります。");
      } else {
        setError(err instanceof Error ? err.message : "データ取得に失敗しました");
      }
      setApiResponse(null);
      setDataset(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700 max-w-full overflow-hidden">
          {/* ヘッダーセクション */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <Map className="w-6 h-6 text-indigo-600" />
                e-STAT コロプレス地図
              </h1>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                e-Stat APIから取得した統計データを都道府県別にコロプレス地図で可視化します
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-x-2">
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

              {/* エラー表示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-900/20 dark:border-red-700">
                  <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    データの取得に失敗しました
                  </h2>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* ローディング表示 */}
              {loading && (
                <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-neutral-800">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-neutral-400">
                        データを取得中...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* コロプレス地図 */}
              {dataset && (
                <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-neutral-800 overflow-hidden">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-4">
                    {dataset.title}
                  </h2>
                  <div className="w-full overflow-x-auto">
                    <ChoroplethMap
                      dataset={dataset}
                      width={800}
                      height={600}
                      className="w-full max-w-full"
                    />
                  </div>
                </div>
              )}

              {/* 使用方法 */}
              <div className="bg-gray-50 rounded-lg p-6 dark:bg-neutral-700">
                <h3 className="font-medium text-gray-900 dark:text-neutral-100 mb-4">
                  使用方法
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-neutral-300">
                  <div>
                    <strong>基本的な使い方:</strong>
                    <ol className="mt-1 ml-4 space-y-1 list-decimal">
                      <li>上のフォームで統計表IDを入力</li>
                      <li>必要に応じて分類、地域、時間軸を指定</li>
                      <li>「データを取得」ボタンをクリック</li>
                      <li>コロプレス地図が表示されます</li>
                    </ol>
                  </div>
                  <div>
                    <strong>デフォルト設定:</strong>
                    <ul className="mt-1 ml-4 space-y-1">
                      <li>• 統計表ID: 0000010101（人口推計）</li>
                      <li>• 分類01: A1101（総人口）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

