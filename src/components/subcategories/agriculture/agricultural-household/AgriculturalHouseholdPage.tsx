"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { AgriculturalHouseholdRanking } from "./AgriculturalHouseholdRanking";

interface AgriculturalHouseholdPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const AgriculturalHouseholdPage: React.FC<
  AgriculturalHouseholdPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010103";
  const cdCat01 = {
    C3101: "C3101",
    C3102: "C3102",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C3101,
            }}
            areaCode="00000"
            title="全国農業産出額"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C3102,
            }}
            areaCode="00000"
            title="全国農家数"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <AgriculturalHouseholdRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
