"use client";

import React, { useState } from "react";
import { EstatDataFetcher } from "@/components/estat/data";
import { EstatDataFormatter } from "@/lib/estat/response/EstatDataFormatter";
import { EstatStatsDataResponse, GetStatsDataParams } from "@/types/estat";
import ChoroplethDisplay from "../ChoroplethDisplay/ChoroplethDisplay";

export default function ChoroplethContainer() {
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

      {/* コロプレス地図表示 */}
      {dataset && <ChoroplethDisplay dataset={dataset} />}
    </div>
  );
}