"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const PoliceCrimeDashboard: React.FC<SubcategoryDashboardPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const statsDataId = "0000010158";
  const cdCat01 = {
    crimes: "EEE1101", // 犯罪件数
    arrests: "EEE1102", // 検挙件数
    policeOfficers: "EEE1103", // 警察官数
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
          {/* 犯罪件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.crimes,
            }}
            areaCode={areaCode}
            title={isNational ? "全国犯罪件数" : "犯罪件数"}
            color="#ef4444"
          />

          {/* 検挙件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.arrests,
            }}
            areaCode={areaCode}
            title={isNational ? "全国検挙件数" : "検挙件数"}
            color="#dc2626"
          />

          {/* 警察官数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.policeOfficers,
            }}
            areaCode={areaCode}
            title={isNational ? "全国警察官数" : "警察官数"}
            color="#b91c1c"
          />
        </div>
      </div>

      {/* 警察・犯罪の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国警察・犯罪の詳細分析
            </h2>
            {/* 警察・犯罪の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              警察・犯罪詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
