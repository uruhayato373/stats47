"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";

export const CommutingEmploymentNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010132";
  const cdCat01 = {
    commuters: "EE1101", // 通勤者数
    commutingTime: "EE1102", // 通勤時間
    employmentRate: "EE1103", // 就職率
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
          {/* 通勤者数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.commuters,
            }}
            areaCode={areaCode}
            title="全国通勤者数"
            color="#eab308"
          />

          {/* 通勤時間 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.commutingTime,
            }}
            areaCode={areaCode}
            title="全国通勤時間"
            color="#ca8a04"
          />

          {/* 就職率 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.employmentRate,
            }}
            areaCode={areaCode}
            title="全国就職率"
            color="#a16207"
          />
        </div>
      </div>

      {/* 全国通勤・就職の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国通勤・就職の詳細分析
          </h2>
          {/* 通勤・就職の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            通勤・就職詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国通勤圏分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国通勤圏分析
          </h2>
          {/* 通勤圏分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            通勤圏分析コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
