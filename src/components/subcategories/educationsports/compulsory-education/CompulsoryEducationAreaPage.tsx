"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface CompulsoryEducationAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
}

export const CompulsoryEducationAreaPage: React.FC<
  CompulsoryEducationAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の義務教育
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E6101,
            }}
            areaCode={areaCode}
            title="義務教育学校数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E7101,
            }}
            areaCode={areaCode}
            title="中等教育学校数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E6101,
            }}
            areaCode={areaCode}
            title="義務教育学校数（6～14歳人口10万人当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E7101,
            }}
            areaCode={areaCode}
            title="中等教育学校数（12～17歳人口10万人当たり）"
            color="#ef4444"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
