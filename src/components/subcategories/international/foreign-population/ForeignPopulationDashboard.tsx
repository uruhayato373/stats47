"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const ForeignPopulationDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010115";
  const cdCat01 = {
    foreignResidents: "N1101", // 外国人住民数
    naturalizations: "N1102", // 帰化者数
    internationalStudents: "N1103", // 留学生数
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
          {/* 外国人住民数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.foreignResidents,
            }}
            areaCode={areaCode}
            title={isNational ? "全国外国人住民数" : "外国人住民数"}
            color="#3b82f6"
          />

          {/* 帰化者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.naturalizations,
            }}
            areaCode={areaCode}
            title={isNational ? "全国帰化者数" : "帰化者数"}
            color="#1d4ed8"
          />

          {/* 留学生数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.internationalStudents,
            }}
            areaCode={areaCode}
            title={isNational ? "全国留学生数" : "留学生数"}
            color="#1e40af"
          />
        </div>
      </div>

      {/* 外国人人口の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国外国人人口の詳細分析
            </h2>
            {/* 外国人人口の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              外国人人口詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
