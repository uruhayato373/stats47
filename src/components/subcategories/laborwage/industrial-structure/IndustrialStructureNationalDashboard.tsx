"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const IndustrialStructureNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010131";
  const cdCat01 = {
    primaryIndustry: "DD1101", // 第1次産業
    secondaryIndustry: "DD1102", // 第2次産業
    tertiaryIndustry: "DD1103", // 第3次産業
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
          {/* 第1次産業 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.primaryIndustry,
            }}
            areaCode={areaCode}
            title="全国第1次産業"
            color="#eab308"
          />

          {/* 第2次産業 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.secondaryIndustry,
            }}
            areaCode={areaCode}
            title="全国第2次産業"
            color="#ca8a04"
          />

          {/* 第3次産業 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.tertiaryIndustry,
            }}
            areaCode={areaCode}
            title="全国第3次産業"
            color="#a16207"
          />
        </div>
      </div>

      {/* 全国産業構造の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国産業構造の詳細分析
          </h2>
          {/* 産業構造の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            産業構造詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国産業別就業者数推移 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国産業別就業者数推移
          </h2>
          {/* 産業別就業者数推移コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            産業別就業者数推移コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
