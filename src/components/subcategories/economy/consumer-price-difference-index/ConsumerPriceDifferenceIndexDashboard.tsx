"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const ConsumerPriceDifferenceIndexDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010122";
  const cdCat01 = {
    priceIndex: "U1101", // 物価指数
    regionalDifference: "U1102", // 地域差
    priceLevel: "U1103", // 価格水準
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
          {/* 物価指数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.priceIndex,
            }}
            areaCode={areaCode}
            title={isNational ? "全国物価指数" : "物価指数"}
            color="#3b82f6"
          />

          {/* 地域差 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.regionalDifference,
            }}
            areaCode={areaCode}
            title={isNational ? "全国地域差" : "地域差"}
            color="#10b981"
          />

          {/* 価格水準 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.priceLevel,
            }}
            areaCode={areaCode}
            title={isNational ? "全国価格水準" : "価格水準"}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 消費者物価地域差指数の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国消費者物価地域差指数の詳細分析
            </h2>
            {/* 消費者物価地域差指数の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              消費者物価地域差指数詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
