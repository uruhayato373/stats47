"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const MarriageNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    marriages: "A2101", // 婚姻件数
    divorces: "A2102", // 離婚件数
    marriageRate: "A2103", // 婚姻率
    divorceRate: "A2104", // 離婚率
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 婚姻件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.marriages,
            }}
            areaCode={areaCode}
            title="全国婚姻件数"
            color="#3b82f6"
          />

          {/* 離婚件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.divorces,
            }}
            areaCode={areaCode}
            title="全国離婚件数"
            color="#ef4444"
          />

          {/* 婚姻率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.marriageRate,
            }}
            areaCode={areaCode}
            title="全国婚姻率"
            color="#10b981"
          />

          {/* 離婚率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.divorceRate,
            }}
            areaCode={areaCode}
            title="全国離婚率"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国婚姻・離婚の推移 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国婚姻・離婚の推移
          </h2>
          {/* 婚姻・離婚の推移グラフコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            婚姻・離婚推移グラフコンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国婚姻動向分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国婚姻動向分析
          </h2>
          {/* 婚姻動向分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            婚姻動向分析コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
