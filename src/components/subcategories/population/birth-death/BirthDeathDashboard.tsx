"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const BirthDeathDashboard: React.FC<SubcategoryDashboardPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const statsDataId = "0000010101";
  const cdCat01 = {
    births: "A4101", // 出生数
    deaths: "A4102", // 死亡数
    naturalIncrease: "A4103", // 自然増減数
    birthRate: "A4104", // 出生率
    deathRate: "A4105", // 死亡率
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 出生数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.births,
            }}
            areaCode={areaCode}
            title={isNational ? "全国出生数" : "出生数"}
            color="#3b82f6"
          />

          {/* 死亡数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deaths,
            }}
            areaCode={areaCode}
            title={isNational ? "全国死亡数" : "死亡数"}
            color="#ef4444"
          />

          {/* 自然増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.naturalIncrease,
            }}
            areaCode={areaCode}
            title={isNational ? "全国自然増減数" : "自然増減数"}
            color="#10b981"
          />

          {/* 出生率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.birthRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国出生率" : "出生率"}
            color="#8b5cf6"
          />

          {/* 死亡率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deathRate,
            }}
            areaCode={areaCode}
            title={isNational ? "全国死亡率" : "死亡率"}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 出生・死亡の推移グラフ（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国出生・死亡の推移
            </h2>
            {/* 出生・死亡の推移グラフコンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              出生・死亡推移グラフコンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
