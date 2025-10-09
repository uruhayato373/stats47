"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface BusinessScaleAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
}

export const BusinessScaleAreaPage: React.FC<BusinessScaleAreaPageProps> = ({
  category,
  subcategory,
  areaCode,
  areaName,
}) => {
  const statsDataId = "0000010203";
  const cdCat01 = {
    C2206: "C02206", // 従業者1～4人の事業所割合（民営）
    C2207: "C02207", // 従業者5～9人の事業所割合（民営）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の企業規模
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2206,
            }}
            areaCode={areaCode}
            title="従業者1～4人の事業所割合（民営）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2207,
            }}
            areaCode={areaCode}
            title="従業者5～9人の事業所割合（民営）"
            color="#10b981"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
