"use client";

import React from "react";

import { EstatStackedBarChart } from "@/components/organisms/estat-api/EstatStackedBarChart";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/common/subcategory";

export const PopulationCompositionPrefectureDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010101";
  const ageCompositionCodes = ["A1301", "A1302", "A1303"]; // 15歳未満, 15-64歳, 65歳以上

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      <div className="px-4 pt-4">
        <EstatStackedBarChart
          params={{
            statsDataId: statsDataId,
            cdCat01: ageCompositionCodes,
          }}
          areaCode={areaCode}
          title="年齢3区分別人口の推移"
          yLabel="人口（人）"
          width={800}
          height={500}
        />
      </div>

      {/* 都道府県の人口構成詳細 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            人口構成詳細
          </h2>
          {/* 都道府県の人口構成詳細コンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            人口構成詳細コンポーネント（実装予定）
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

      {/* 年齢別人口ピラミッド */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            年齢別人口ピラミッド
          </h2>
          {/* 人口ピラミッドコンポーネントをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            人口ピラミッドコンポーネント（実装予定）
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
