"use client";

import React, { useEffect, useState } from "react";
import { Sparkline, SparklineDataPoint } from "@/components/d3/Sparkline";
import { EstatStatsDataFormatter, GetStatsDataParams } from "@/lib/estat-api";
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

export interface StatisticsMetricCardProps {
  /**
   * e-stat API パラメータ
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * 都道府県コード（指定しない場合は全国データ "00000" を使用）
   */
  areaCode?: string;

  /**
   * タイトル
   */
  title?: string;

  /**
   * 色スキーム
   */
  color?: string;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (data: SparklineDataPoint[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

/**
 * 統計データの最新値とトレンドを表示するメトリックカードコンポーネント
 */
export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  params,
  areaCode = "00000",
  title,
  color = "#4f46e5",
  className = "",
  onDataLoaded,
  onError,
}) => {
  const [timeSeriesData, setTimeSeriesData] = useState<SparklineDataPoint[]>(
    []
  );
  const [unit, setUnit] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // e-stat APIからデータを取得
        const response = await EstatStatsDataFormatter.getAndFormatStatsData(
          params.statsDataId,
          {
            categoryFilter: params.cdCat01,
            limit: params.limit || 100000,
          }
        );

        // 指定されたエリアコードのデータをフィルタリング
        const filteredValues = response.values.filter(
          (v) => v.areaCode === areaCode && v.numericValue !== null
        );

        if (filteredValues.length === 0) {
          throw new Error(
            `指定された地域（${areaCode}）のデータが見つかりませんでした`
          );
        }

        // unit情報を取得（最初のデータから）
        const firstValue = filteredValues[0];
        if (firstValue.unit) {
          setUnit(firstValue.unit);
        }

        // 時系列データに変換
        const dataByYear = new Map<string, number>();
        filteredValues.forEach((v) => {
          if (v.timeCode && v.numericValue !== null) {
            dataByYear.set(v.timeCode, v.numericValue);
          }
        });

        const timeSeries: SparklineDataPoint[] = Array.from(
          dataByYear.entries()
        )
          .map(([year, value]) => ({
            year,
            value,
          }))
          .sort((a, b) => a.year.localeCompare(b.year));

        setTimeSeriesData(timeSeries);

        if (onDataLoaded) {
          onDataLoaded(timeSeries);
        }
      } catch (err) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.cdCat01, params.limit, areaCode]);

  // ローディング状態
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 ${className}`}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // データがない場合
  if (timeSeriesData.length === 0) {
    return (
      <div
        className={`bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-6 ${className}`}
      >
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          データがありません
        </p>
      </div>
    );
  }

  // 最新値と前回値を取得
  const latestData = timeSeriesData[timeSeriesData.length - 1];
  const previousData =
    timeSeriesData.length > 1
      ? timeSeriesData[timeSeriesData.length - 2]
      : null;

  // 変化率を計算
  const change = previousData ? latestData.value - previousData.value : 0;
  const changePercent =
    previousData && previousData.value !== 0
      ? (change / previousData.value) * 100
      : 0;

  const isPositive = change >= 0;

  // 値をフォーマット
  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6 ${className}`}
    >
      {/* タイトル */}
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-neutral-400">
            {title}
          </h3>
        </div>
      )}

      {/* 最新値 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(latestData.value)}
          </span>
          {unit && (
            <span className="text-sm text-gray-600 dark:text-neutral-400">
              {unit}
            </span>
          )}
        </div>

        {/* 変化率 */}
        {previousData && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? "+" : ""}
              {changePercent.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-neutral-500 ml-1">
              前回比
            </span>
          </div>
        )}
      </div>

      {/* スパークライン */}
      <div className="mt-4">
        <Sparkline
          data={timeSeriesData}
          width={300}
          height={50}
          color={color}
          showArea={true}
          className="w-full"
        />
      </div>

      {/* 期間表示 */}
      <div className="mt-2 text-xs text-gray-500 dark:text-neutral-500">
        {timeSeriesData[0]?.year.substring(0, 4)}年 -{" "}
        {latestData.year.substring(0, 4)}年
      </div>
    </div>
  );
};
