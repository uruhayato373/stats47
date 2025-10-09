"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const HousingStatisticsDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010141";
  const cdCat01 = {
    totalHouses: "NN1101", // 総住宅数
    vacantHouses: "NN1102", // 空き家数
    vacancyRate: "NN1103", // 空き家率
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
          {/* 総住宅数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalHouses,
            }}
            areaCode={areaCode}
            title={isNational ? "全国総住宅数" : "総住宅数"}
            color="#f97316"
          />

          {/* 空き家数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.vacantHouses,
            }}
            areaCode={areaCode}
            title={isNational ? "全国空き家数" : "空き家数"}
            color="#ea580c"
          />

          {/* 空き家率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.vacancyRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国空き家率" : "空き家率"}
            color="#c2410c"
          />
        </div>
      </div>

      {/* 住宅統計の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国住宅統計の詳細分析
            </h2>
            {/* 住宅統計の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              住宅統計詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
