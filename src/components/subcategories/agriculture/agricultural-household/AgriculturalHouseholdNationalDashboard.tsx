"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const AgriculturalHouseholdNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010104";
  const cdCat01 = {
    agriculturalHouseholds: "D1101", // 農業世帯数
    farmWorkers: "D1102", // 農業従事者数
    farmArea: "D1103", // 農地面積
  };

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
          {/* 農業世帯数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.agriculturalHouseholds,
            }}
            areaCode={areaCode}
            title="全国農業世帯数"
            color="#10b981"
          />

          {/* 農業従事者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.farmWorkers,
            }}
            areaCode={areaCode}
            title="全国農業従事者数"
            color="#059669"
          />

          {/* 農地面積 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.farmArea,
            }}
            areaCode={areaCode}
            title="全国農地面積"
            color="#047857"
          />
        </div>
      </div>

      {/* 全国農業の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国農業の詳細分析
          </h2>
          {/* 農業の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            農業詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国農業政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国農業政策動向
          </h2>
          {/* 農業政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            農業政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
