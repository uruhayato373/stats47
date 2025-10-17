"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const FireInsuranceNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010157";
  const cdCat01 = {
    fireIncidents: "DDD1101", // 火災件数
    fireDamage: "DDD1102", // 火災損害額
    insuranceClaims: "DDD1103", // 保険金支払額
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
          {/* 火災件数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.fireIncidents,
            }}
            areaCode={areaCode}
            title="全国火災件数"
            color="#ef4444"
          />

          {/* 火災損害額 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.fireDamage,
            }}
            areaCode={areaCode}
            title="全国火災損害額"
            color="#dc2626"
          />

          {/* 保険金支払額 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.insuranceClaims,
            }}
            areaCode={areaCode}
            title="全国保険金支払額"
            color="#b91c1c"
          />
        </div>
      </div>

      {/* 全国火災・保険の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国火災・保険の詳細分析
          </h2>
          {/* 火災・保険の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            火災・保険詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国火災保険政策動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国火災保険政策動向
          </h2>
          {/* 火災保険政策動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            火災保険政策動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
