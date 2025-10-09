"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const DeathStatisticsDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010151";
  const cdCat01 = {
    deaths: "XX1101", // 死亡数
    deathRate: "XX1102", // 死亡率
    lifeExpectancy: "XX1103", // 平均寿命
  };

  const isNational = areaCode === "00000";

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 死亡数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deaths,
            }}
            areaCode={areaCode}
            title={isNational ? "全国死亡数" : "死亡数"}
            color="#ec4899"
          />

          {/* 死亡率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deathRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国死亡率" : "死亡率"}
            color="#db2777"
          />

          {/* 平均寿命 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.lifeExpectancy,
            }}
            areaCode={areaCode}
            title={isNational ? "全国平均寿命" : "平均寿命"}
            color="#be185d"
          />
        </div>
      </div>

      {/* 死亡統計の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国死亡統計の詳細分析
            </h2>
            {/* 死亡統計の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              死亡統計詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
