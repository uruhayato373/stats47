"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const HouseholdEconomyPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010118";
  const cdCat01 = {
    householdIncome: "Q1101", // 世帯収入
    householdExpenditure: "Q1102", // 世帯支出
    savings: "Q1103", // 貯蓄
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
          {/* 世帯収入 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.householdIncome,
            }}
            areaCode={areaCode}
            title="世帯収入"
            color="#3b82f6"
          />

          {/* 世帯支出 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.householdExpenditure,
            }}
            areaCode={areaCode}
            title="世帯支出"
            color="#10b981"
          />

          {/* 貯蓄 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.savings,
            }}
            areaCode={areaCode}
            title="貯蓄"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 都道府県の家計詳細 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            家計詳細
          </h2>
          {/* 都道府県の家計詳細コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            家計詳細コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国との比較 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国との比較
          </h2>
          {/* 全国との比較グラフコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            全国との比較グラフコンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 周辺都道府県との比較 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            周辺都道府県との比較
          </h2>
          {/* 周辺都道府県との比較コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            周辺都道府県との比較コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
