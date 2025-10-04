/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { ChoroplethMap, MapVisualizationOptions } from "@/components/d3/ChoroplethMap";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { GetStatsDataParams } from "@/lib/estat/types/parameters";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { RefreshCw, AlertCircle } from "lucide-react";

export interface EstatChoroplethMapProps {
  /**
   * e-stat API パラメータ
   * statsDataId は必須、その他のパラメータでデータをフィルタリング
   */
  params: Omit<GetStatsDataParams, 'appId'>;

  /**
   * 地図の可視化オプション
   */
  options?: MapVisualizationOptions;

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
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (values: FormattedValue[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

const defaultOptions: MapVisualizationOptions = {
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
};

/**
 * e-stat APIから直接データを取得してコロプレス地図を表示するコンポーネント
 */
export const EstatChoroplethMap: React.FC<EstatChoroplethMapProps> = ({
  params,
  options = defaultOptions,
  width = 800,
  height = 600,
  className = "",
  onDataLoaded,
  onError,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  // ステップ1: 年度一覧を取得
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        console.log('[EstatChoroplethMap] Step 1: Fetching available years...');

        // 少量のデータを取得して年度一覧を取得
        const response = await EstatStatsDataService.getAndFormatStatsData(
          params.statsDataId,
          {
            categoryFilter: params.cdCat01,
            limit: 100, // 少量のみ
          }
        );

        // 年度一覧を抽出
        const years = response.years
          .map((y) => y.timeCode)
          .filter((code) => code && code.length >= 4)
          .sort((a, b) => b.localeCompare(a)); // 降順ソート（最新が先頭）

        console.log('[EstatChoroplethMap] Available years:', years);
        setAvailableYears(years);

        // 最新年度を選択（または指定された年度）
        const targetYear = params.cdTime || years[0] || '';
        setSelectedYear(targetYear);
      } catch (err) {
        console.error('[EstatChoroplethMap] Error fetching years:', err);
        const errorMessage = err instanceof Error ? err.message : '年度一覧の取得に失敗しました';
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    };

    fetchAvailableYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.cdCat01, params.cdTime]);

  // ステップ2: 選択年度のデータを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYear) {
        return; // 年度が選択されるまで待つ
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[EstatChoroplethMap] Step 2: Fetching data for year:', selectedYear);

        // 選択年度のデータを取得
        const response = await EstatStatsDataService.getAndFormatStatsData(
          params.statsDataId,
          {
            categoryFilter: params.cdCat01,
            yearFilter: selectedYear, // 年度フィルタを指定
            limit: params.limit || 100000,
          }
        );

        console.log('[EstatChoroplethMap] Data fetched:', {
          totalValues: response.values.length,
          validValues: response.metadata.validValues,
        });

        // 都道府県データのみをフィルタリング（全国データを除外）
        const prefectureValues = response.values.filter(
          (v) => v.areaCode && v.areaCode !== "00000" && v.numericValue !== null
        );

        console.log('[EstatChoroplethMap] Prefecture values:', prefectureValues.length);

        if (prefectureValues.length === 0) {
          throw new Error('都道府県データが見つかりませんでした');
        }

        setFormattedValues(prefectureValues);

        if (onDataLoaded) {
          onDataLoaded(prefectureValues);
        }
      } catch (err) {
        console.error('[EstatChoroplethMap] Error fetching data:', err);
        const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
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
  }, [selectedYear, params.statsDataId, params.cdCat01, params.limit]);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || '100%', height: height || '600px' }}
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
          style={{ width: width || '100%', height: height || '600px' }}
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
              {params.cdTime && <p>年度: {params.cdTime}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (formattedValues.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || '100%', height: height || '600px' }}
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

  // 年度変更ハンドラー
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  // 地図表示
  return (
    <div className={className}>
      {/* 年度選択UI */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <label
          htmlFor="year-select"
          className="text-sm text-gray-600 dark:text-neutral-400"
        >
          年度:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
          disabled={loading || availableYears.length === 0}
        >
          {availableYears.length === 0 && (
            <option value="">年度を読み込み中...</option>
          )}
          {availableYears.map((yearCode) => {
            // タイムコードを年に変換（例: 2020000000 -> 2020）
            const displayYear = yearCode.substring(0, 4);
            return (
              <option key={yearCode} value={yearCode}>
                {displayYear}年
              </option>
            );
          })}
        </select>
      </div>

      <ChoroplethMap
        data={formattedValues}
        width={width}
        height={height}
        options={options}
      />
    </div>
  );
};
