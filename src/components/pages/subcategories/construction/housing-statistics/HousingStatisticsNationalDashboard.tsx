"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const HousingStatisticsNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010141";
  const cdCat01 = {
    totalHouses: "NN1101", // 総住宅数
    vacantHouses: "NN1102", // 空き家数
    vacancyRate: "NN1103", // 空き家率
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
          {/* 総住宅数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalHouses,
            }}
            areaCode={areaCode}
            title="全国総住宅数"
            color="#f97316"
          />

          {/* 空き家数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.vacantHouses,
            }}
            areaCode={areaCode}
            title="全国空き家数"
            color="#ea580c"
          />

          {/* 空き家率 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.vacancyRate,
            }}
            areaCode={areaCode}
            title="全国空き家率"
            color="#c2410c"
          />
        </div>
      </div>

      {/* 全国住宅統計の詳細分析 */}
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

      {/* 全国空き家問題分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国空き家問題分析
          </h2>
          {/* 空き家問題分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            空き家問題分析コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
