"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const InfrastructureEnergyNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010143";
  const cdCat01 = {
    electricity: "PP1101", // 電力供給量
    gas: "PP1102", // ガス供給量
    renewable: "PP1103", // 再生可能エネルギー
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 電力供給量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.electricity,
            }}
            areaCode={areaCode}
            title="全国電力供給量"
            color="#0891b2"
          />

          {/* ガス供給量 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.gas,
            }}
            areaCode={areaCode}
            title="全国ガス供給量"
            color="#0e7490"
          />

          {/* 再生可能エネルギー */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.renewable,
            }}
            areaCode={areaCode}
            title="全国再生可能エネルギー"
            color="#155e75"
          />
        </div>
      </div>

      {/* 全国インフラ・エネルギーの詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国インフラ・エネルギーの詳細分析
          </h2>
          {/* インフラ・エネルギーの詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            インフラ・エネルギー詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国エネルギー政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国エネルギー政策動向
          </h2>
          {/* エネルギー政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            エネルギー政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
