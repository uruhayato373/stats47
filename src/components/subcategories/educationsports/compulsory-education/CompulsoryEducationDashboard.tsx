"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const CompulsoryEducationDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010129";
  const cdCat01 = {
    elementarySchools: "BB1101", // 小学校数
    juniorHighSchools: "BB1102", // 中学校数
    students: "BB1103", // 生徒数
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
          {/* 小学校数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.elementarySchools,
            }}
            areaCode={areaCode}
            title={isNational ? "全国小学校数" : "小学校数"}
            color="#8b5cf6"
          />

          {/* 中学校数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.juniorHighSchools,
            }}
            areaCode={areaCode}
            title={isNational ? "全国中学校数" : "中学校数"}
            color="#7c3aed"
          />

          {/* 生徒数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.students,
            }}
            areaCode={areaCode}
            title={isNational ? "全国生徒数" : "生徒数"}
            color="#6d28d9"
          />
        </div>
      </div>

      {/* 義務教育の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国義務教育の詳細分析
            </h2>
            {/* 義務教育の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              義務教育詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
