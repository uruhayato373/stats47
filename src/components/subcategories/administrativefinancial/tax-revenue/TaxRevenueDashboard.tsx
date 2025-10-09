"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const TaxRevenueDashboard: React.FC<SubcategoryDashboardPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const statsDataId = "0000010124";
  const cdCat01 = {
    taxRevenue: "W1101", // 税収
    incomeTax: "W1102", // 所得税
    corporateTax: "W1103", // 法人税
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
          {/* 税収 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.taxRevenue,
            }}
            areaCode={areaCode}
            title={isNational ? "全国税収" : "税収"}
            color="#6b7280"
          />

          {/* 所得税 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.incomeTax,
            }}
            areaCode={areaCode}
            title={isNational ? "全国所得税" : "所得税"}
            color="#4b5563"
          />

          {/* 法人税 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.corporateTax,
            }}
            areaCode={areaCode}
            title={isNational ? "全国法人税" : "法人税"}
            color="#374151"
          />
        </div>
      </div>

      {/* 税収の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国税収の詳細分析
            </h2>
            {/* 税収の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              税収詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
