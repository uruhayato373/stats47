"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const StaffAssemblyElectionPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010123";
  const cdCat01 = {
    staff: "V1101", // 職員数
    assemblyMembers: "V1102", // 議会議員数
    electionTurnout: "V1103", // 投票率
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
          {/* 職員数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.staff,
            }}
            areaCode={areaCode}
            title="職員数"
            color="#6b7280"
          />

          {/* 議会議員数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.assemblyMembers,
            }}
            areaCode={areaCode}
            title="議会議員数"
            color="#4b5563"
          />

          {/* 投票率 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.electionTurnout,
            }}
            areaCode={areaCode}
            title="投票率"
            color="#374151"
          />
        </div>
      </div>

      {/* 都道府県の職員・議会・選挙詳細 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            職員・議会・選挙詳細
          </h2>
          {/* 都道府県の職員・議会・選挙詳細コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            職員・議会・選挙詳細コンポーネント（実装予定）
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
