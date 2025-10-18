"use client";

import React from "react";

import { EstatStackedBarChart } from "@/components/organisms/estat-api/EstatStackedBarChart";
import { SubcategoryLayout } from "@/components/templates/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";

export const PopulationCompositionNationalDashboard: React.FC<
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
          title="全国年齢3区分別人口の推移"
          yLabel="人口（人）"
          width={800}
          height={500}
        />
      </div>

      {/* 全国人口構成の詳細分析 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国人口構成の詳細分析
          </h2>
          {/* 人口ピラミッドやその他の詳細グラフをここに追加 */}
          <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
            人口構成詳細分析コンポーネント（実装予定）
          </div>
        </div>
      </div>

      {/* 全国年齢別人口ピラミッド */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            全国年齢別人口ピラミッド
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
