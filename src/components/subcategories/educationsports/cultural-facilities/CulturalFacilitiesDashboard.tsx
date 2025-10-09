"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const CulturalFacilitiesDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010148";
  const cdCat01 = {
    museums: "UU1101", // 博物館数
    libraries: "UU1102", // 図書館数
    theaters: "UU1103", // 劇場・音楽堂数
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
          {/* 博物館数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.museums,
            }}
            areaCode={areaCode}
            title={isNational ? "全国博物館数" : "博物館数"}
            color="#eab308"
          />

          {/* 図書館数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.libraries,
            }}
            areaCode={areaCode}
            title={isNational ? "全国図書館数" : "図書館数"}
            color="#ca8a04"
          />

          {/* 劇場・音楽堂数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.theaters,
            }}
            areaCode={areaCode}
            title={isNational ? "全国劇場・音楽堂数" : "劇場・音楽堂数"}
            color="#a16207"
          />
        </div>
      </div>

      {/* 文化施設の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国文化施設の詳細分析
            </h2>
            {/* 文化施設の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              文化施設詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
