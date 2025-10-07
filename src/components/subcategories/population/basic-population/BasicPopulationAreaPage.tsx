"use client";

import React, { useState, useCallback } from "react";

import { EstatLineChart } from "@/components/dashboard/LineChart";
import { EstatPopulationPyramid } from "@/components/dashboard/PopulationPyramid";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { TimeSeriesDataPoint } from "@/components/d3/LineChart";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryAreaPageProps } from "@/types/subcategory";

export const BasicPopulationAreaPage: React.FC<SubcategoryAreaPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const [areaName] = useState<string>(areaCode);

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    dayNightRatio: "A6108", // 昼夜間人口比率
  };

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback((data: TimeSeriesDataPoint[]) => {
    console.log("[BasicPopulationAreaPage] Data loaded:", data.length);
    // TimeSeriesDataPointからFormattedValueに変換する必要がある場合はここで処理
    // 現在は地域名の取得のみなので、areaNameは別途設定
  }, []);

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback((error: Error) => {
    console.error("[BasicPopulationAreaPage] Error:", error);
  }, []);

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* ヘッダー */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {areaName || "読み込み中..."}
        </h1>
      </div>

      {/* 統計カード */}
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 総人口 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode={areaCode}
            title={`${areaName}総人口`}
            color="#4f46e5"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayNightRatio,
            }}
            areaCode={areaCode}
            title={`${areaName}昼夜間人口比率`}
            color="#10b981"
          />
        </div>
      </div>

      {/* メインコンテンツ：2カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* 折れ線グラフエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {areaName}の推移
            </h2>
            <EstatLineChart
              params={{
                statsDataId: statsDataId,
                cdCat01: cdCat01.totalPopulation,
                limit: 100000,
              }}
              areaCode={areaCode}
              width={800}
              height={500}
              yLabel={subcategory.unit}
              title={`${subcategory.name}の推移（${areaName}）`}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
          </div>
        </div>
      </div>

      {/* 人口ピラミッド */}
      <div className="px-4 pb-4">
        <EstatPopulationPyramid
          params={{
            statsDataId: statsDataId,
          }}
          areaCode={areaCode}
          title={`${areaName}人口ピラミッド`}
          height={500}
        />
      </div>
    </SubcategoryLayout>
  );
};
