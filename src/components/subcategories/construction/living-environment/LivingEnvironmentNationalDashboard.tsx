"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const LivingEnvironmentNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010108";
  const cdCat01 = {
    housingUnits: "G1101", // 住宅数
    housingStock: "G1102", // 住宅ストック
    housingStarts: "G1103", // 住宅着工数
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
          {/* 住宅数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.housingUnits,
            }}
            areaCode={areaCode}
            title="全国住宅数"
            color="#f97316"
          />

          {/* 住宅ストック */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.housingStock,
            }}
            areaCode={areaCode}
            title="全国住宅ストック"
            color="#ea580c"
          />

          {/* 住宅着工数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.housingStarts,
            }}
            areaCode={areaCode}
            title="全国住宅着工数"
            color="#dc2626"
          />
        </div>
      </div>

      {/* 全国生活環境の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国生活環境の詳細分析
          </h2>
          {/* 生活環境の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            生活環境詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国住宅政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国住宅政策動向
          </h2>
          {/* 住宅政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            住宅政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
