/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { LineChart, TimeSeriesDataPoint } from "@/components/d3/LineChart";
import { EstatStatsDataFormatter } from "@/lib/estat-api";
import { GetStatsDataParams } from "@/lib/estat-api";
import { RefreshCw, AlertCircle } from "lucide-react";

export interface EstatLineChartProps {
  /**
   * e-stat API パラメータ
   * statsDataId は必須
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * 都道府県コード（指定しない場合は全国データ "00000" を使用）
   */
  areaCode?: string;

  /**
   * 幅（ピクセル）
   */
  width?: number;

  /**
   * 高さ（ピクセル）
   */
  height?: number;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * X軸ラベル
   */
  xLabel?: string;

  /**
   * Y軸ラベル
   */
  yLabel?: string;

  /**
   * グラフタイトル
   */
  title?: string;

  /**
   * 色スキーム
   */
  colorScheme?: string;

  /**
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (data: TimeSeriesDataPoint[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

/**
 * e-stat APIから時系列データを取得して折れ線グラフを表示するコンポーネント
 */
export const EstatLineChart: React.FC<EstatLineChartProps> = ({
  params,
  areaCode = "00000", // デフォルトは全国
  width = 800,
  height = 400,
  className = "",
  xLabel = "年度",
  yLabel,
  title,
  colorScheme = "#4f46e5",
  onDataLoaded,
  onError,
}) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("[EstatLineChart] Fetching data with params:", params);

        // e-stat APIからデータを取得（年度フィルタなしで全期間のデータを取得）
        const response = await EstatStatsDataFormatter.getAndFormatStatsData(
          params.statsDataId,
          {
            categoryFilter: params.cdCat01,
            limit: params.limit || 100000,
          }
        );

        console.log("[EstatLineChart] Data fetched:", {
          totalValues: response.values.length,
          years: response.years.length,
        });

        // 指定されたエリアコードのデータをフィルタリング
        const filteredValues = response.values.filter(
          (v) => v.areaCode === areaCode && v.numericValue !== null
        );

        console.log(
          "[EstatLineChart] Filtered values for area",
          areaCode,
          ":",
          filteredValues.length
        );

        if (filteredValues.length === 0) {
          throw new Error(
            `指定された地域（${areaCode}）のデータが見つかりませんでした`
          );
        }

        // 時系列データに変換（年度ごとにグループ化）
        const dataByYear = new Map<string, number>();
        filteredValues.forEach((v) => {
          if (v.timeCode && v.numericValue !== null) {
            dataByYear.set(v.timeCode, v.numericValue);
          }
        });

        // TimeSeriesDataPoint形式に変換してソート
        const timeSeries: TimeSeriesDataPoint[] = Array.from(
          dataByYear.entries()
        )
          .map(([year, value]) => ({
            year,
            value,
          }))
          .sort((a, b) => a.year.localeCompare(b.year));

        console.log("[EstatLineChart] Time series data:", timeSeries.length);

        setTimeSeriesData(timeSeries);

        if (onDataLoaded) {
          onDataLoaded(timeSeries);
        }
      } catch (err) {
        console.error("[EstatLineChart] Error fetching data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // onDataLoaded と onError を依存配列から除外（無限ループ防止）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.cdCat01, params.limit, areaCode]);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データを読み込み中...
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              e-stat APIからデータを取得しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データの取得に失敗しました
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
              {error}
            </p>
            <div className="text-xs text-gray-600 dark:text-neutral-400 mt-4">
              <p>統計表ID: {params.statsDataId}</p>
              {params.cdCat01 && <p>カテゴリ: {params.cdCat01}</p>}
              <p>地域コード: {areaCode}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (timeSeriesData.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データがありません
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              指定された条件に一致するデータが見つかりませんでした
            </p>
          </div>
        </div>
      </div>
    );
  }

  // グラフ表示
  return (
    <div className={className}>
      <LineChart
        data={timeSeriesData}
        width={width}
        height={height}
        xLabel={xLabel}
        yLabel={yLabel}
        title={title}
        colorScheme={colorScheme}
      />
    </div>
  );
};
