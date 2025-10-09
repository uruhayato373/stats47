"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const LaborForceStructureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010130";
  const cdCat01 = {
    laborForce: "CC1101", // 労働力人口
    employmentRate: "CC1102", // 就業率
    unemploymentRate: "CC1103", // 失業率
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
          {/* 労働力人口 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.laborForce,
            }}
            areaCode={areaCode}
            title={isNational ? "全国労働力人口" : "労働力人口"}
            color="#eab308"
          />

          {/* 就業率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.employmentRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国就業率" : "就業率"}
            color="#ca8a04"
          />

          {/* 失業率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.unemploymentRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国失業率" : "失業率"}
            color="#a16207"
          />
        </div>
      </div>

      {/* 労働力構造の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国労働力構造の詳細分析
            </h2>
            {/* 労働力構造の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              労働力構造詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
