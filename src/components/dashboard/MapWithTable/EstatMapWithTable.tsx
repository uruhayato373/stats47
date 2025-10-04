"use client";

import React, { useState, useCallback } from "react";
import { EstatChoroplethMap } from "@/components/dashboard/ChoroplethMap";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryData } from "@/types/choropleth";
import { GetStatsDataParams } from "@/lib/estat/types/parameters";

export interface EstatMapWithTableProps {
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
 */
export const EstatMapWithTable: React.FC<EstatMapWithTableProps> = ({
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

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback(
    (values: FormattedValue[]) => {
      console.log("[EstatMapWithTable] Data loaded:", values.length);
      setFormattedValues(values);

      if (onDataLoaded) {
        onDataLoaded(values);
      }
    },
    [onDataLoaded]
  );

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback(
    (error: Error) => {
      console.error("[EstatMapWithTable] Error:", error);

      if (onError) {
        onError(error);
      }
    },
    [onError]
  );

  return (
    <div className={className}>
      {/* 統計サマリー */}
      <div className="px-4 mb-4">
        <StatisticsSummary data={formattedValues} unit={subcategory.unit} />
      </div>

      {/* 地図とデータテーブル */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden px-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-full">
            <EstatChoroplethMap
              params={params}
              options={{
                colorScheme: options?.colorScheme || subcategory.colorScheme || "interpolateBlues",
                divergingMidpoint: options?.divergingMidpoint || "zero",
              }}
              width={mapWidth}
              height={mapHeight}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <div className="lg:w-80 h-full lg:border-s border-gray-200 dark:border-neutral-700 lg:ps-4">
            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
              <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                都道府県別データ
              </h2>
              <PrefectureDataTableClient
                data={formattedValues}
                subcategory={subcategory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
