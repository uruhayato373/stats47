"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";

export const WaterSupplySewerageNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010109";
  const cdCat01 = {
    waterSupplyRate: "H1101", // 上水道普及率
    sewerageRate: "H1102", // 下水道普及率
    waterUsage: "H1103", // 水使用量
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
          {/* 上水道普及率 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.waterSupplyRate,
            }}
            areaCode={areaCode}
            title="全国上水道普及率"
            color="#06b6d4"
          />

          {/* 下水道普及率 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.sewerageRate,
            }}
            areaCode={areaCode}
            title="全国下水道普及率"
            color="#0891b2"
          />

          {/* 水使用量 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.waterUsage,
            }}
            areaCode={areaCode}
            title="全国水使用量"
            color="#0e7490"
          />
        </div>
      </div>

      {/* 全国上水道・下水道の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国上水道・下水道の詳細分析
          </h2>
          {/* 上水道・下水道の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            上水道・下水道詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国水インフラ政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国水インフラ政策動向
          </h2>
          {/* 水インフラ政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            水インフラ政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
