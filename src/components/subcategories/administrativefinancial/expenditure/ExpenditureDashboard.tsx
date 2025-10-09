"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const ExpenditureDashboard: React.FC<SubcategoryDashboardPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const statsDataId = "0000010156";
  const cdCat01 = {
    generalExpenditure: "CCC1101", // 一般会計支出
    specialExpenditure: "CCC1102", // 特別会計支出
    debtService: "CCC1103", // 公債費
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
          {/* 一般会計支出 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.generalExpenditure,
            }}
            areaCode={areaCode}
            title={isNational ? "全国一般会計支出" : "一般会計支出"}
            color="#6b7280"
          />

          {/* 特別会計支出 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.specialExpenditure,
            }}
            areaCode={areaCode}
            title={isNational ? "全国特別会計支出" : "特別会計支出"}
            color="#4b5563"
          />

          {/* 公債費 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.debtService,
            }}
            areaCode={areaCode}
            title={isNational ? "全国公債費" : "公債費"}
            color="#374151"
          />
        </div>
      </div>

      {/* 歳出の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国歳出の詳細分析
            </h2>
            {/* 歳出の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              歳出詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
