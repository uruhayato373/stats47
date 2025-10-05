"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryData } from "@/types/choropleth";
import { GetStatsDataParams } from "@/lib/estat/types/parameters";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { RefreshCw, AlertCircle } from "lucide-react";

export interface EstatRankingProps {
  /**
   * e-stat API パラメータ
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * サブカテゴリーデータ
   */
  subcategory: SubcategoryData;

  /**
   * 地図の可視化オプション
   */
  options?: {
    colorScheme?: string;
    divergingMidpoint?: "zero" | "mean" | "median" | number;
  };

  /**
   * 地図の幅（ピクセル）
   */
  mapWidth?: number;

  /**
   * 地図の高さ（ピクセル）
   */
  mapHeight?: number;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * データ読み込み完了時のコールバック
   */
  onDataLoaded?: (values: FormattedValue[]) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

/**
 * コロプレス地図、統計サマリー、都道府県別データテーブルを一つにまとめたコンポーネント
 * データ取得を担当し、表示コンポーネントにデータを渡す
 */
export const EstatRanking: React.FC<EstatRankingProps> = ({
  params,
  subcategory,
  options,
  mapWidth = 800,
  mapHeight = 600,
  className = "",
  onDataLoaded,
  onError,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  console.log("[EstatRanking] Params:", params);

  // ステップ1: 年度一覧を取得
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        console.log("[EstatRanking] Step 1: Fetching available years...");

        const years = await EstatStatsDataService.getAvailableYears(
          params.statsDataId,
          params.cdCat01
        );

        console.log("[EstatRanking] Available years:", years);
        setAvailableYears(years);

        // 最新年度を選択（または指定された年度）
        const targetYear = params.cdTime || years[0] || "";
        setSelectedYear(targetYear);
      } catch (err) {
        console.error("[EstatRanking] Error fetching years:", err);
        const errorMessage =
          err instanceof Error ? err.message : "年度一覧の取得に失敗しました";
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
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(
          "[EstatRanking] Step 2: Fetching data for year:",
          selectedYear
        );

        const prefectureValues =
          await EstatStatsDataService.getPrefectureDataByYear(
            params.statsDataId,
            params.cdCat01,
            selectedYear,
            params.limit || 100000
          );

        console.log(
          "[EstatRanking] Prefecture values:",
          prefectureValues.length
        );

        setFormattedValues(prefectureValues);

        if (onDataLoaded) {
          onDataLoaded(prefectureValues);
        }
      } catch (err) {
        console.error("[EstatRanking] Error fetching data:", err);
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
  }, [selectedYear, params.statsDataId, params.cdCat01, params.limit]);

  // 年度変更ハンドラー
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ height: "600px" }}
        >
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-neutral-400">
              データを読み込んでいます...
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
          style={{ height: "600px" }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データの取得に失敗しました
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 年度選択UI */}
      <div className="px-4 mb-4 flex items-center justify-end gap-2">
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
            const displayYear = yearCode.substring(0, 4);
            return (
              <option key={yearCode} value={yearCode}>
                {displayYear}年
              </option>
            );
          })}
        </select>
      </div>

      {/* 地図とデータテーブル */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden gap-4">
          {/* 地図 */}
          <div>
            <ChoroplethMap
              data={formattedValues}
              options={{
                colorScheme:
                  options?.colorScheme ||
                  subcategory.colorScheme ||
                  "interpolateBlues",
                divergingMidpoint: options?.divergingMidpoint || "zero",
              }}
              width={mapWidth}
              height={mapHeight}
            />
          </div>

          {/* 統計サマリー */}
          <div>
            <StatisticsSummary data={formattedValues} unit={subcategory.unit || ''} />
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <PrefectureDataTableClient
            data={formattedValues}
            subcategory={subcategory}
          />
        </div>
      </div>
    </div>
  );
};
