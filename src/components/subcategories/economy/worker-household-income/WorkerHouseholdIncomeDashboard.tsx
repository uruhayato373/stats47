"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const WorkerHouseholdIncomeDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010107";
  const cdCat01 = {
    averageIncome: "F1101", // 平均収入
    medianIncome: "F1102", // 中央値収入
    disposableIncome: "F1103", // 可処分所得
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
          {/* 平均収入 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.averageIncome,
            }}
            areaCode={areaCode}
            title={isNational ? "全国平均収入" : "平均収入"}
            color="#3b82f6"
          />

          {/* 中央値収入 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.medianIncome,
            }}
            areaCode={areaCode}
            title={isNational ? "全国中央値収入" : "中央値収入"}
            color="#10b981"
          />

          {/* 可処分所得 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.disposableIncome,
            }}
            areaCode={areaCode}
            title={isNational ? "全国可処分所得" : "可処分所得"}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 労働者世帯収入の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国労働者世帯収入の詳細分析
            </h2>
            {/* 労働者世帯収入の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              労働者世帯収入詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
