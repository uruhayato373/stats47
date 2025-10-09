"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const PollutionEnvironmentDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010159";
  const cdCat01 = {
    airPollution: "FFF1101", // 大気汚染
    waterPollution: "FFF1102", // 水質汚濁
    wasteDisposal: "FFF1103", // 廃棄物処理
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
          {/* 大気汚染 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.airPollution,
            }}
            areaCode={areaCode}
            title={isNational ? "全国大気汚染" : "大気汚染"}
            color="#ef4444"
          />

          {/* 水質汚濁 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.waterPollution,
            }}
            areaCode={areaCode}
            title={isNational ? "全国水質汚濁" : "水質汚濁"}
            color="#dc2626"
          />

          {/* 廃棄物処理 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.wasteDisposal,
            }}
            areaCode={areaCode}
            title={isNational ? "全国廃棄物処理" : "廃棄物処理"}
            color="#b91c1c"
          />
        </div>
      </div>

      {/* 公害・環境の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国公害・環境の詳細分析
            </h2>
            {/* 公害・環境の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              公害・環境詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
