"use client";

import React, { useState, useCallback } from "react";
import { SubcategoryLayout } from "../SubcategoryLayout";
import { EstatChoroplethMap } from "@/components/dashboard/ChoroplethMap";
import { EstatLineChart } from "@/components/dashboard/LineChart";
import { EstatGenderDonutChart } from "@/components/dashboard/GenderDonutChart";
import { PrefectureDataTableClient } from "@/components/choropleth/PrefectureDataTableClient";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { EstatPopulationPyramid } from "@/components/dashboard/PopulationPyramid";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";

interface BasicPopulationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BasicPopulationPage: React.FC<BasicPopulationPageProps> = ({
  category,
  subcategory,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    dayNightRatio: "A6108", // 昼夜間人口比率
    malePopulation: "A110101", // 総人口（男）
    femalePopulation: "A110102", // 総人口（女）
  };

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback((values: FormattedValue[]) => {
    console.log("[BasicPopulationPage] Data loaded:", values.length);
    setFormattedValues(values);
  }, []);

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback((error: Error) => {
    console.error("[BasicPopulationPage] Map error:", error);
  }, []);

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 総人口 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalPopulation,
            }}
            areaCode="00000"
            title="全国総人口"
            unit="人"
            color="#4f46e5"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayNightRatio,
            }}
            areaCode="00000"
            title="全国昼夜間人口比率"
            unit="%"
            color="#10b981"
          />

          {/* 男女人口比率 */}
          <EstatGenderDonutChart
            params={{
              statsDataId: statsDataId,
            }}
            maleCategoryCode={cdCat01.malePopulation}
            femaleCategoryCode={cdCat01.femalePopulation}
            areaCode="00000"
            title="男女人口比率"
            width={300}
            height={300}
          />
        </div>
        <StatisticsSummary data={formattedValues} unit={subcategory.unit} />
      </div>

      {/* メインコンテンツ：3カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-full">
            <EstatChoroplethMap
              params={{
                statsDataId: statsDataId,
                cdCat01: cdCat01.totalPopulation,
              }}
              options={{
                colorScheme: subcategory.colorScheme || "interpolateBlues",
                divergingMidpoint: "zero",
              }}
              width={800}
              height={600}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
          </div>
        </div>

        {/* 折れ線グラフエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国の推移
            </h2>
            <EstatLineChart
              params={{
                statsDataId: statsDataId,
                cdCat01: cdCat01.totalPopulation,
                limit: 100000,
              }}
              areaCode="00000"
              width={800}
              height={500}
              yLabel={subcategory.unit}
              title={`${subcategory.name}の推移（全国）`}
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

      {/* 人口ピラミッド */}
      <div className="px-4 pb-4">
        <EstatPopulationPyramid
          params={{
            statsDataId: statsDataId,
          }}
          areaCode="00000"
          title="全国人口ピラミッド"
          height={500}
        />
      </div>
    </SubcategoryLayout>
  );
};
