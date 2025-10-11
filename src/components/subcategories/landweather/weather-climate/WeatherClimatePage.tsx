"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface WeatherClimatePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WeatherClimatePage: React.FC<WeatherClimatePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010202";
  const cdCat01 = {
    avgTemperature: "#B02101",
    precipitation: "#B02402",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgTemperature,
            }}
            areaCode="00000"
            title="全国年平均気温"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.precipitation,
            }}
            areaCode="00000"
            title="全国年間降水量"
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
