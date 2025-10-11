"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const FireEmergencyNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010113";
  const cdCat01 = {
    fireStations: "L1101", // 消防署数
    firefighters: "L1102", // 消防職員数
    fireTrucks: "L1103", // 消防車両数
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
          {/* 消防署数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.fireStations,
            }}
            areaCode={areaCode}
            title="全国消防署数"
            color="#ef4444"
          />

          {/* 消防職員数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.firefighters,
            }}
            areaCode={areaCode}
            title="全国消防職員数"
            color="#dc2626"
          />

          {/* 消防車両数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.fireTrucks,
            }}
            areaCode={areaCode}
            title="全国消防車両数"
            color="#b91c1c"
          />
        </div>
      </div>

      {/* 全国消防・緊急事態の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国消防・緊急事態の詳細分析
          </h2>
          {/* 消防・緊急事態の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            消防・緊急事態詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国消防政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国消防政策動向
          </h2>
          {/* 消防政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            消防政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
