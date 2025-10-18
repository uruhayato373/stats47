"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";

export const NaturalEnvironmentNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010201";
  const cdCat01 = {
    nationalParks: "#A01301", // 国立公園
    quasiNationalParks: "#A01302", // 国定公園
    prefecturalParks: "#A01303", // 都道府県立自然公園
    naturalMonuments: "#A01304", // 天然記念物
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
          {/* 国立公園 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.nationalParks,
            }}
            areaCode={areaCode}
            title="全国国立公園"
            color="#10b981"
          />

          {/* 国定公園 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.quasiNationalParks,
            }}
            areaCode={areaCode}
            title="全国国定公園"
            color="#059669"
          />

          {/* 都道府県立自然公園 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.prefecturalParks,
            }}
            areaCode={areaCode}
            title="全国都道府県立自然公園"
            color="#0d9488"
          />

          {/* 天然記念物 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.naturalMonuments,
            }}
            areaCode={areaCode}
            title="全国天然記念物"
            color="#047857"
          />
        </div>
      </div>

      {/* 全国自然環境の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国自然環境の詳細分析
          </h2>
          {/* 自然環境の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            自然環境詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国自然保護地域マップ */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国自然保護地域マップ
          </h2>
          {/* 自然保護地域マップコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            自然保護地域マップコンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
