"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const SocialActivitiesNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010150";
  const cdCat01 = {
    volunteers: "WW1101", // ボランティア活動者数
    clubs: "WW1102", // クラブ・サークル数
    events: "WW1103", // イベント開催数
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
          {/* ボランティア活動者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.volunteers,
            }}
            areaCode={areaCode}
            title="全国ボランティア活動者数"
            color="#eab308"
          />

          {/* クラブ・サークル数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.clubs,
            }}
            areaCode={areaCode}
            title="全国クラブ・サークル数"
            color="#ca8a04"
          />

          {/* イベント開催数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.events,
            }}
            areaCode={areaCode}
            title="全国イベント開催数"
            color="#a16207"
          />
        </div>
      </div>

      {/* 全国社会活動の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国社会活動の詳細分析
          </h2>
          {/* 社会活動の詳細分析コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            社会活動詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国社会活動動向 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国社会活動動向
          </h2>
          {/* 社会活動動向コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            社会活動動向コンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
