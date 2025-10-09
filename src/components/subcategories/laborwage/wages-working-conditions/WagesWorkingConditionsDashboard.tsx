"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const WagesWorkingConditionsDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010117";
  const cdCat01 = {
    averageWage: "P1101", // 平均賃金
    minimumWage: "P1102", // 最低賃金
    workingHours: "P1103", // 労働時間
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
          {/* 平均賃金 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.averageWage,
            }}
            areaCode={areaCode}
            title={isNational ? "全国平均賃金" : "平均賃金"}
            color="#eab308"
          />

          {/* 最低賃金 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.minimumWage,
            }}
            areaCode={areaCode}
            title={isNational ? "全国最低賃金" : "最低賃金"}
            color="#ca8a04"
          />

          {/* 労働時間 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.workingHours,
            }}
            areaCode={areaCode}
            title={isNational ? "全国労働時間" : "労働時間"}
            color="#a16207"
          />
        </div>
      </div>

      {/* 賃金・労働条件の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国賃金・労働条件の詳細分析
            </h2>
            {/* 賃金・労働条件の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              賃金・労働条件詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
