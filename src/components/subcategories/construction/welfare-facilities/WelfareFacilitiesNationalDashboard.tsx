"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const WelfareFacilitiesNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010127";
  const cdCat01 = {
    facilities: "Z1101", // 福祉施設数
    capacity: "Z1102", // 収容定員
    utilizationRate: "Z1103", // 利用率
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
          {/* 福祉施設数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.facilities,
            }}
            areaCode={areaCode}
            title="全国福祉施設数"
            color="#7c3aed"
          />

          {/* 収容定員 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.capacity,
            }}
            areaCode={areaCode}
            title="全国収容定員"
            color="#6d28d9"
          />

          {/* 利用率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.utilizationRate,
            }}
            areaCode={areaCode}
            title="全国利用率"
            color="#5b21b6"
          />
        </div>
      </div>

      {/* 全国福祉施設の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国福祉施設の詳細分析
          </h2>
          {/* 福祉施設の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            福祉施設詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国福祉政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国福祉政策動向
          </h2>
          {/* 福祉政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            福祉政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
