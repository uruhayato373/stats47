/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { D3LineChart } from "@/components/molecules/D3LineChart";
import { EstatStatsDataFormatter, GetStatsDataParams } from "@/lib/estat-api";
import { RefreshCw, AlertCircle } from "lucide-react";

export interface SeriesConfig {
  categoryCode: string;
  label: string;
  color: string;
}

export interface EstatMultiLineChartProps {
  /**
   * e-stat API パラメータ
   * statsDataId は必須
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * 表示する系列の設定
   */
  series: SeriesConfig[];

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
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (data: any) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

interface MultiSeriesDataPoint {
  year: string;
  [key: string]: string | number;
}

/**
 * e-stat APIから複数系列のデータを取得して折れ線グラフを表示するコンポーネント
 */
export const EstatMultiLineChart: React.FC<EstatMultiLineChartProps> = ({
  params,
  series,
  areaCode = "00000",
  width = 800,
  height = 400,
  className = "",
  xLabel = "年度",
  yLabel,
  title,
  onDataLoaded,
  onError,
}) => {
  const [chartData, setChartData] = useState<MultiSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // e-stat APIからデータを取得（指定地域のデータのみ）
        const response = await EstatStatsDataFormatter.getAndFormatStatsData(
          params.statsDataId,
          {
            areaFilter: areaCode,
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

        // 年度ごとにデータをグループ化
        const dataByYear = new Map<string, MultiSeriesDataPoint>();

        series.forEach((s) => {
          const seriesData = filteredValues.filter(
            (v) => v.categoryCode === s.categoryCode
          );

          seriesData.forEach((v) => {
            if (v.timeCode && v.numericValue !== null) {
              if (!dataByYear.has(v.timeCode)) {
                dataByYear.set(v.timeCode, { year: v.timeCode });
              }
              const yearData = dataByYear.get(v.timeCode)!;
              yearData[s.label] = v.numericValue;
            }
          });
        });

        // 配列に変換してソート
        const multiSeriesData = Array.from(dataByYear.values()).sort((a, b) =>
          a.year.localeCompare(b.year)
        );

        setChartData(multiSeriesData);

        if (onDataLoaded) {
          onDataLoaded(multiSeriesData);
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
  }, [params.statsDataId, params.limit, areaCode, JSON.stringify(series)]);

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
              <p>地域コード: {areaCode}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (chartData.length === 0) {
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
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
        )}
        <D3LineChart
          data={chartData}
          width={width}
          height={height}
          xLabel={xLabel}
          yLabel={yLabel}
          multiSeries={series.map((s) => ({
            key: s.label,
            color: s.color,
          }))}
        />

        {/* 凡例 */}
        <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: s.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
