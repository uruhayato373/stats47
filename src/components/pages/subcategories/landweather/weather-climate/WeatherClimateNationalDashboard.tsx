"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";

export const WeatherClimateNationalDashboard: React.FC<
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
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgTemperature,
            }}
            areaCode={areaCode}
            title="全国年平均気温"
            color="#ef4444"
          />

          {/* 年間降水量 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.precipitation,
            }}
            areaCode={areaCode}
            title="全国年間降水量"
            color="#3b82f6"
          />

          {/* 年平均相対湿度 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.humidity,
            }}
            areaCode={areaCode}
            title="全国年平均相対湿度"
            color="#10b981"
          />

          {/* 日照時間 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.sunshineDuration,
            }}
            areaCode={areaCode}
            title="全国日照時間（年間）"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国気象データの推移 */}
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

      {/* 全国気象分布マップ */}
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

      {/* 全国気候区分 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国気候区分
          </h2>
          {/* 気候区分コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            気候区分コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
