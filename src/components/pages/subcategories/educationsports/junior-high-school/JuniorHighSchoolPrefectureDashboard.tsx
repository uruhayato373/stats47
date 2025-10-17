"use client";

import React from "react";

import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const JuniorHighSchoolPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010145";
  const cdCat01 = {
    schools: "RR1101", // 中学校数
    students: "RR1102", // 生徒数
    teachers: "RR1103", // 教員数
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
          {/* 中学校数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.schools,
            }}
            areaCode={areaCode}
            title="中学校数"
            color="#eab308"
          />

          {/* 生徒数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.students,
            }}
            areaCode={areaCode}
            title="生徒数"
            color="#ca8a04"
          />

          {/* 教員数 */}
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.teachers,
            }}
            areaCode={areaCode}
            title="教員数"
            color="#a16207"
          />
        </div>
      </div>

      {/* 都道府県の中学校詳細 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            中学校詳細
          </h2>
          {/* 都道府県の中学校詳細コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            中学校詳細コンポーネント（実装予定）
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
