"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface BusinessScalePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BusinessScalePage: React.FC<BusinessScalePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010203";
  const cdCat01 = {
    C2206: "C02206", // 従業者1～4人の事業所割合（民営）
    C2207: "C02207", // 従業者5～9人の事業所割合（民営）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2206,
            }}
            areaCode="00000"
            title="従業者1～4人の事業所割合（民営）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2207,
            }}
            areaCode="00000"
            title="従業者5～9人の事業所割合（民営）"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        
      </div>
    </SubcategoryLayout>
  );
};
