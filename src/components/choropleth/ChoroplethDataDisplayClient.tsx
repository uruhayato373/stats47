"use client";

import React, { useState } from "react";
import {
  ChoroplethDisplayData,
  SubcategoryData,
  ChoroplethDataPoint,
} from "@/types/choropleth";
import { ChoroplethMap } from "@/components/d3/ChoroplethMap";
import { FormattedValue } from "@/lib/estat/types/formatted";

interface ChoroplethDataDisplayClientProps {
  data: ChoroplethDisplayData | null;
  formattedValues: FormattedValue[] | null;
  subcategory: SubcategoryData;
  year: string;
  className?: string;
}

export const ChoroplethDataDisplayClient: React.FC<
  ChoroplethDataDisplayClientProps
> = ({ data, formattedValues, subcategory, year, className = "" }) => {
  const [selectedPrefecture, setSelectedPrefecture] =
    useState<ChoroplethDataPoint | null>(null);

  // データが存在しない場合の表示
  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-neutral-400 text-sm">
            データを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {/* 地図表示エリア */}
      <div className="relative w-full h-full bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
        {/* ヘッダー情報 */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {subcategory.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">
              {year}年{subcategory.unit ? ` | 単位: ${subcategory.unit}` : ''}
            </div>
          </div>
        </div>

        {/* 地図表示 */}
        <div className="w-full h-full">
          {formattedValues && formattedValues.length > 0 ? (
            <ChoroplethMap
              data={formattedValues}
              options={{
                colorScheme: subcategory.colorScheme || "interpolateBlues",
                divergingMidpoint: "zero",
              }}
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 dark:text-neutral-400">
                データがありません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
