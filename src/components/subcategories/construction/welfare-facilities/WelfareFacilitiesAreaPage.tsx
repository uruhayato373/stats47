"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface WelfareFacilitiesAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
  currentYear: string;
}

export const WelfareFacilitiesAreaPage: React.FC<
  WelfareFacilitiesAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
  const statsDataId = "0000010210";
  const cdCat01 = {
    J022011: "#J022011", // 老人ホーム数
    J02202: "#J02202", // 老人福祉センター数
    J02501: "#J02501", // 児童福祉施設等数
    J02301: "#J02301", // 身体障害者更生援護施設数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の福祉施設
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J022011,
            }}
            areaCode={areaCode}
            title={`${areaName}の老人ホーム数（65歳以上人口10万人当たり）`}
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J02202,
            }}
            areaCode={areaCode}
            title={`${areaName}の老人福祉センター数（65歳以上人口10万人当たり）`}
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J02501,
            }}
            areaCode={areaCode}
            title={`${areaName}の児童福祉施設等数（人口10万人当たり）`}
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J02301,
            }}
            areaCode={areaCode}
            title={`${areaName}の身体障害者更生援護施設数（人口100万人当たり）`}
            color="#ef4444"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
