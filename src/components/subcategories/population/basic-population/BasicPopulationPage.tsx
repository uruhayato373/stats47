"use client";

import React from "react";

import { EstatGenderDonutChart } from "@/components/dashboard/GenderDonutChart";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { BasicPopulationRanking } from "./BasicPopulationRanking";
import { SubcategoryPageProps } from "@/types/subcategory";

export const BasicPopulationPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalPopulation: "A1101", // 総人口
    dayNightRatio: "A6108", // 昼夜間人口比率
    malePopulation: "A110101", // 総人口（男）
    femalePopulation: "A110102", // 総人口（女）
  };

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
            title="全国総人口"
            color="#4f46e5"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayNightRatio,
            }}
            title="全国昼夜間人口比率"
            color="#10b981"
          />

          {/* 男女人口比率 */}
          <EstatGenderDonutChart
            params={{
              statsDataId: statsDataId,
            }}
            maleCategoryCode={cdCat01.malePopulation}
            femaleCategoryCode={cdCat01.femalePopulation}
            title="男女人口比率"
            width={300}
            height={300}
          />
        </div>
      </div>

      {/* 折れ線グラフエリア */}
      {/* <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
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
      </div> */}

      {/* コロプレス地図とデータテーブル */}
      <BasicPopulationRanking subcategory={subcategory} />

      {/* 人口ピラミッド */}
      {/* <div className="px-4 pb-4">
        <EstatPopulationPyramid
          params={{
            statsDataId: statsDataId,
          }}
          areaCode="00000"
          title="全国人口ピラミッド"
          height={500}
        />
      </div> */}
    </SubcategoryLayout>
  );
};
