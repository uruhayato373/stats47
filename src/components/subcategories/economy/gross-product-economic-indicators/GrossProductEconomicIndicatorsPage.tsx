"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { GrossProductEconomicIndicatorsRanking } from "./GrossProductEconomicIndicatorsRanking";

interface GrossProductEconomicIndicatorsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const GrossProductEconomicIndicatorsPage: React.FC<
  GrossProductEconomicIndicatorsPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010103";
  const cdCat01 = {
    C1121: "C1121",
    C122101: "C122101",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C1121,
            }}
            areaCode="00000"
            title="全国県内総生産額"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C122101,
            }}
            areaCode="00000"
            title="全国1人当たり県民所得"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <GrossProductEconomicIndicatorsRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
