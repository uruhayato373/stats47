"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const WeatherClimateDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010202";
  const cdCat01 = {
    avgTemperature: "#B02101", // 年平均気温
    precipitation: "#B02402", // 年間降水量
    humidity: "#B02201", // 年平均相対湿度
    sunshineDuration: "#B02401", // 日照時間（年間）
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 年平均気温 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgTemperature,
            }}
            areaCode={areaCode}
            title={isNational ? "全国年平均気温" : "年平均気温"}
            color="#ef4444"
          />

          {/* 年間降水量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.precipitation,
            }}
            areaCode={areaCode}
            title={isNational ? "全国年間降水量" : "年間降水量"}
            color="#3b82f6"
          />

          {/* 年平均相対湿度 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.humidity,
            }}
            areaCode={areaCode}
            title={isNational ? "全国年平均相対湿度" : "年平均相対湿度"}
            color="#10b981"
          />

          {/* 日照時間 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.sunshineDuration,
            }}
            areaCode={areaCode}
            title={isNational ? "全国日照時間（年間）" : "日照時間（年間）"}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 気象グラフエリア（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国気象データの推移
            </h2>
            {/* 気象データの折れ線グラフコンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              気象データ折れ線グラフコンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}

      {/* 気象分布マップ（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国気象分布マップ
            </h2>
            {/* 気象分布マップコンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              気象分布マップコンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
