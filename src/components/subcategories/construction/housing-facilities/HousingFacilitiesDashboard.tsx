"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const HousingFacilitiesDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010139";
  const cdCat01 = {
    airConditioning: "LL1101", // エアコン
    internet: "LL1102", // インターネット
    solarPanel: "LL1103", // 太陽光パネル
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
          {/* エアコン */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.airConditioning,
            }}
            areaCode={areaCode}
            title={isNational ? "全国エアコン設置率" : "エアコン設置率"}
            color="#f97316"
          />

          {/* インターネット */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.internet,
            }}
            areaCode={areaCode}
            title={
              isNational ? "全国インターネット普及率" : "インターネット普及率"
            }
            color="#ea580c"
          />

          {/* 太陽光パネル */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.solarPanel,
            }}
            areaCode={areaCode}
            title={isNational ? "全国太陽光パネル設置率" : "太陽光パネル設置率"}
            color="#c2410c"
          />
        </div>
      </div>

      {/* 住宅設備の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国住宅設備の詳細分析
            </h2>
            {/* 住宅設備の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              住宅設備詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
