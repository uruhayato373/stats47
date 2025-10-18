"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const HouseholdsNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    totalHouseholds: "A3101", // 総世帯数
    averageHouseholdSize: "A3102", // 平均世帯人員
    nuclearFamilyHouseholds: "A3103", // 核家族世帯数
    singlePersonHouseholds: "A3104", // 単独世帯数
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
          {/* 総世帯数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalHouseholds,
            }}
            areaCode={areaCode}
            title="全国総世帯数"
            color="#3b82f6"
          />

          {/* 平均世帯人員 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.averageHouseholdSize,
            }}
            areaCode={areaCode}
            title="全国平均世帯人員"
            color="#10b981"
          />

          {/* 核家族世帯数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.nuclearFamilyHouseholds,
            }}
            areaCode={areaCode}
            title="全国核家族世帯数"
            color="#8b5cf6"
          />

          {/* 単独世帯数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.singlePersonHouseholds,
            }}
            areaCode={areaCode}
            title="全国単独世帯数"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国世帯構成の推移 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国世帯構成の推移
          </h2>
          {/* 世帯構成の推移グラフコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            世帯構成推移グラフコンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国世帯類型分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国世帯類型分析
          </h2>
          {/* 世帯類型分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            世帯類型分析コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
