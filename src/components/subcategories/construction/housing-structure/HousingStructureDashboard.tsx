"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const HousingStructureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010138";
  const cdCat01 = {
    woodenHouses: "KK1101", // 木造住宅
    concreteHouses: "KK1102", // コンクリート住宅
    steelHouses: "KK1103", // 鉄骨住宅
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
          {/* 木造住宅 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.woodenHouses,
            }}
            areaCode={areaCode}
            title={isNational ? "全国木造住宅" : "木造住宅"}
            color="#f97316"
          />

          {/* コンクリート住宅 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.concreteHouses,
            }}
            areaCode={areaCode}
            title={isNational ? "全国コンクリート住宅" : "コンクリート住宅"}
            color="#ea580c"
          />

          {/* 鉄骨住宅 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.steelHouses,
            }}
            areaCode={areaCode}
            title={isNational ? "全国鉄骨住宅" : "鉄骨住宅"}
            color="#c2410c"
          />
        </div>
      </div>

      {/* 住宅構造の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国住宅構造の詳細分析
            </h2>
            {/* 住宅構造の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              住宅構造詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
