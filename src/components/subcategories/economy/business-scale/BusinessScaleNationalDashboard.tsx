"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const BusinessScaleNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010120";
  const cdCat01 = {
    largeEnterprises: "S1101", // 大企業数
    mediumEnterprises: "S1102", // 中企業数
    smallEnterprises: "S1103", // 小企業数
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
          {/* 大企業数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.largeEnterprises,
            }}
            areaCode={areaCode}
            title="全国大企業数"
            color="#3b82f6"
          />

          {/* 中企業数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.mediumEnterprises,
            }}
            areaCode={areaCode}
            title="全国中企業数"
            color="#10b981"
          />

          {/* 小企業数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.smallEnterprises,
            }}
            areaCode={areaCode}
            title="全国小企業数"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国企業規模の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国企業規模の詳細分析
          </h2>
          {/* 企業規模の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            企業規模詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国企業規模動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国企業規模動向
          </h2>
          {/* 企業規模動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            企業規模動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
