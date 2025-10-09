"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const IndustrialWaterDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010142";
  const cdCat01 = {
    waterUsage: "OO1101", // 工業用水使用量
    waterSupply: "OO1102", // 工業用水供給量
    recyclingRate: "OO1103", // 水リサイクル率
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
          {/* 工業用水使用量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.waterUsage,
            }}
            areaCode={areaCode}
            title={isNational ? "全国工業用水使用量" : "工業用水使用量"}
            color="#0891b2"
          />

          {/* 工業用水供給量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.waterSupply,
            }}
            areaCode={areaCode}
            title={isNational ? "全国工業用水供給量" : "工業用水供給量"}
            color="#0e7490"
          />

          {/* 水リサイクル率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.recyclingRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国水リサイクル率" : "水リサイクル率"}
            color="#155e75"
          />
        </div>
      </div>

      {/* 工業用水の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国工業用水の詳細分析
            </h2>
            {/* 工業用水の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              工業用水詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
