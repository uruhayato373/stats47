"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const WasteManagementDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010126";
  const cdCat01 = {
    wasteAmount: "Y1101", // 廃棄物量
    recyclingRate: "Y1102", // リサイクル率
    incinerationRate: "Y1103", // 焼却率
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
          {/* 廃棄物量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.wasteAmount,
            }}
            areaCode={areaCode}
            title={isNational ? "全国廃棄物量" : "廃棄物量"}
            color="#059669"
          />

          {/* リサイクル率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.recyclingRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国リサイクル率" : "リサイクル率"}
            color="#047857"
          />

          {/* 焼却率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.incinerationRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国焼却率" : "焼却率"}
            color="#065f46"
          />
        </div>
      </div>

      {/* 廃棄物処理の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国廃棄物処理の詳細分析
            </h2>
            {/* 廃棄物処理の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              廃棄物処理詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
