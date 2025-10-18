"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const LandUseNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010201";
  const cdCat01 = {
    agriculturalLand: "#A01201", // 農用地
    forestLand: "#A01202", // 森林
    residentialLand: "#A01203", // 宅地
    commercialLand: "#A01204", // 商業地
    industrialLand: "#A01205", // 工業地
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 農用地 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.agriculturalLand,
            }}
            areaCode={areaCode}
            title="全国農用地"
            color="#10b981"
          />

          {/* 森林 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.forestLand,
            }}
            areaCode={areaCode}
            title="全国森林"
            color="#059669"
          />

          {/* 宅地 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.residentialLand,
            }}
            areaCode={areaCode}
            title="全国宅地"
            color="#3b82f6"
          />

          {/* 商業地 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.commercialLand,
            }}
            areaCode={areaCode}
            title="全国商業地"
            color="#8b5cf6"
          />

          {/* 工業地 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.industrialLand,
            }}
            areaCode={areaCode}
            title="全国工業地"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 全国土地利用の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国土地利用の詳細分析
          </h2>
          {/* 土地利用の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            土地利用詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国土地利用分布マップ */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国土地利用分布マップ
          </h2>
          {/* 土地利用分布マップコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            土地利用分布マップコンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
