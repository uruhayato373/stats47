"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const PopulationMovementNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    moversIn: "A5103", // 転入者数
    moversOut: "A5104", // 転出者数
    socialIncrease: "A5302", // 社会増減数
    dayTimePopulationRatio: "A6108", // 昼夜間人口比率
    dayTimePopulation: "A6107", // 昼間人口
    inflowPopulationInPref: "A6105", // 流入人口（県内他市区町村）
    inflowPopulationOtherPref: "A6106", // 流入人口（他県）
    outflowPopulationInPref: "A6103", // 流出人口（県内他市区町村）
    outflowPopulationOtherPref: "A6104", // 流出人口（他県）
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
          {/* 転入者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversIn,
            }}
            areaCode={areaCode}
            title="全国転入者数"
            color="#3b82f6"
          />

          {/* 転出者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversOut,
            }}
            areaCode={areaCode}
            title="全国転出者数"
            color="#ef4444"
          />

          {/* 社会増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.socialIncrease,
            }}
            areaCode={areaCode}
            title="全国社会増減数"
            color="#10b981"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayTimePopulationRatio,
            }}
            areaCode={areaCode}
            title="全国昼夜間人口比率"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国流入・流出人口の詳細 */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 流入人口 */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              流入人口
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <StatisticsMetricCard
                params={{
                  statsDataId: statsDataId,
                  cdCat01: cdCat01.inflowPopulationInPref,
                }}
                areaCode={areaCode}
                title="県内他市区町村"
                color="#3b82f6"
              />
              <StatisticsMetricCard
                params={{
                  statsDataId: statsDataId,
                  cdCat01: cdCat01.inflowPopulationOtherPref,
                }}
                areaCode={areaCode}
                title="他県"
                color="#8b5cf6"
              />
            </div>
          </div>

          {/* 流出人口 */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              流出人口
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <StatisticsMetricCard
                params={{
                  statsDataId: statsDataId,
                  cdCat01: cdCat01.outflowPopulationInPref,
                }}
                areaCode={areaCode}
                title="県内他市区町村"
                color="#ef4444"
              />
              <StatisticsMetricCard
                params={{
                  statsDataId: statsDataId,
                  cdCat01: cdCat01.outflowPopulationOtherPref,
                }}
                areaCode={areaCode}
                title="他県"
                color="#f97316"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 全国人口移動分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国人口移動分析
          </h2>
          {/* 人口移動分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            人口移動分析コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
