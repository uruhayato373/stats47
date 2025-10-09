"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const FiscalIndicatorsDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010112";
  const cdCat01 = {
    revenue: "K1101", // 歳入
    expenditure: "K1102", // 歳出
    debt: "K1103", // 債務
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
          {/* 歳入 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.revenue,
            }}
            areaCode={areaCode}
            title={isNational ? "全国歳入" : "歳入"}
            color="#6b7280"
          />

          {/* 歳出 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.expenditure,
            }}
            areaCode={areaCode}
            title={isNational ? "全国歳出" : "歳出"}
            color="#4b5563"
          />

          {/* 債務 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.debt,
            }}
            areaCode={areaCode}
            title={isNational ? "全国債務" : "債務"}
            color="#374151"
          />
        </div>
      </div>

      {/* 財政指標の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国財政指標の詳細分析
            </h2>
            {/* 財政指標の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              財政指標詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
