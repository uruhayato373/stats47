"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const EmploymentTypeDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010136";
  const cdCat01 = {
    regular: "II1101", // 正規雇用
    nonRegular: "II1102", // 非正規雇用
    selfEmployed: "II1103", // 自営業
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
          {/* 正規雇用 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.regular,
            }}
            areaCode={areaCode}
            title={isNational ? "全国正規雇用" : "正規雇用"}
            color="#eab308"
          />

          {/* 非正規雇用 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.nonRegular,
            }}
            areaCode={areaCode}
            title={isNational ? "全国非正規雇用" : "非正規雇用"}
            color="#ca8a04"
          />

          {/* 自営業 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.selfEmployed,
            }}
            areaCode={areaCode}
            title={isNational ? "全国自営業" : "自営業"}
            color="#a16207"
          />
        </div>
      </div>

      {/* 雇用形態の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国雇用形態の詳細分析
            </h2>
            {/* 雇用形態の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              雇用形態詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
