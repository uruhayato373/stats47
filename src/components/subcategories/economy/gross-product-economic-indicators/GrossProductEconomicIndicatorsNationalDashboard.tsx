"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const GrossProductEconomicIndicatorsNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010121";
  const cdCat01 = {
    grossProduct: "T1101", // 総生産
    economicIndicators: "T1102", // 経済指標
    growthRate: "T1103", // 成長率
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
          {/* 総生産 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.grossProduct,
            }}
            areaCode={areaCode}
            title="全国総生産"
            color="#3b82f6"
          />

          {/* 経済指標 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.economicIndicators,
            }}
            areaCode={areaCode}
            title="全国経済指標"
            color="#10b981"
          />

          {/* 成長率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.growthRate,
            }}
            areaCode={areaCode}
            title="全国成長率"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国総生産・経済指標の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国総生産・経済指標の詳細分析
          </h2>
          {/* 総生産・経済指標の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            総生産・経済指標詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国経済成長動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国経済成長動向
          </h2>
          {/* 経済成長動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            経済成長動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
