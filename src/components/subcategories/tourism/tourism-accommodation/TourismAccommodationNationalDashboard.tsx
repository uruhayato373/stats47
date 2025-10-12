"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const TourismAccommodationNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010110";
  const cdCat01 = {
    tourists: "I1101", // 観光客数
    accommodations: "I1102", // 宿泊施設数
    occupancyRate: "I1103", // 稼働率
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
          {/* 観光客数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.tourists,
            }}
            areaCode={areaCode}
            title="全国観光客数"
            color="#6366f1"
          />

          {/* 宿泊施設数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.accommodations,
            }}
            areaCode={areaCode}
            title="全国宿泊施設数"
            color="#8b5cf6"
          />

          {/* 稼働率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.occupancyRate,
            }}
            areaCode={areaCode}
            title="全国稼働率"
            color="#ec4899"
          />
        </div>
      </div>

      {/* 全国観光・宿泊の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国観光・宿泊の詳細分析
          </h2>
          {/* 観光・宿泊の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            観光・宿泊詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国観光政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国観光政策動向
          </h2>
          {/* 観光政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            観光政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
