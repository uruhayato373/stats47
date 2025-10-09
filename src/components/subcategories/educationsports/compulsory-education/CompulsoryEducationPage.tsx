"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { CompulsoryEducationRanking } from "./CompulsoryEducationRanking";

interface CompulsoryEducationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CompulsoryEducationPage: React.FC<
  CompulsoryEducationPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010105";
  const cdCat01 = {
    E6101: "E6101", // 義務教育学校数
    E7101: "E7101", // 中等教育学校数
  };

  const statsDataIdRatio = "0000010205";
  const cdCat01Ratio = {
    E6101: "E0110107", // 義務教育学校数（6～14歳人口10万人当たり）
    E7101: "E0110108", // 中等教育学校数（12～17歳人口10万人当たり）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E6101,
            }}
            areaCode="00000"
            title="全国義務教育学校数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E7101,
            }}
            areaCode="00000"
            title="全国中等教育学校数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E6101,
            }}
            areaCode="00000"
            title="義務教育学校数（6～14歳人口10万人当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E7101,
            }}
            areaCode="00000"
            title="中等教育学校数（12～17歳人口10万人当たり）"
            color="#ef4444"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <CompulsoryEducationRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
