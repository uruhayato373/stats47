"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const ChildcareEarlyEducationNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010128";
  const cdCat01 = {
    childcareFacilities: "AA1101", // 保育施設数
    childcareCapacity: "AA1102", // 保育定員
    enrollmentRate: "AA1103", // 入園率
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
          {/* 保育施設数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.childcareFacilities,
            }}
            areaCode={areaCode}
            title="全国保育施設数"
            color="#8b5cf6"
          />

          {/* 保育定員 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.childcareCapacity,
            }}
            areaCode={areaCode}
            title="全国保育定員"
            color="#7c3aed"
          />

          {/* 入園率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.enrollmentRate,
            }}
            areaCode={areaCode}
            title="全国入園率"
            color="#6d28d9"
          />
        </div>
      </div>

      {/* 全国保育・幼児教育の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国保育・幼児教育の詳細分析
          </h2>
          {/* 保育・幼児教育の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            保育・幼児教育詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国保育政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国保育政策動向
          </h2>
          {/* 保育政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            保育政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
