"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BusinessActivityDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010119";
  const cdCat01 = {
    businessEstablishments: "R1101", // 事業所数
    employees: "R1102", // 従業者数
    sales: "R1103", // 売上高
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
          {/* 事業所数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.businessEstablishments,
            }}
            areaCode={areaCode}
            title={isNational ? "全国事業所数" : "事業所数"}
            color="#3b82f6"
          />

          {/* 従業者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.employees,
            }}
            areaCode={areaCode}
            title={isNational ? "全国従業者数" : "従業者数"}
            color="#10b981"
          />

          {/* 売上高 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.sales,
            }}
            areaCode={areaCode}
            title={isNational ? "全国売上高" : "売上高"}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 企業活動の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国企業活動の詳細分析
            </h2>
            {/* 企業活動の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              企業活動詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
