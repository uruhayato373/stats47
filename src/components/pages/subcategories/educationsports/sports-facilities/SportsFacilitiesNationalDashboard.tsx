"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const SportsFacilitiesNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010149";
  const cdCat01 = {
    gymnasiums: "VV1101", // 体育館数
    pools: "VV1102", // プール数
    fields: "VV1103", // 運動場数
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
          {/* 体育館数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.gymnasiums,
            }}
            areaCode={areaCode}
            title="全国体育館数"
            color="#eab308"
          />

          {/* プール数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.pools,
            }}
            areaCode={areaCode}
            title="全国プール数"
            color="#ca8a04"
          />

          {/* 運動場数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.fields,
            }}
            areaCode={areaCode}
            title="全国運動場数"
            color="#a16207"
          />
        </div>
      </div>

      {/* 全国スポーツ施設の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国スポーツ施設の詳細分析
          </h2>
          {/* スポーツ施設の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            スポーツ施設詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国スポーツ政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国スポーツ政策動向
          </h2>
          {/* スポーツ政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            スポーツ政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
