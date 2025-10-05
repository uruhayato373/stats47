"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { WeatherClimateRanking } from "./WeatherClimateRanking";

interface WeatherClimatePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WeatherClimatePage: React.FC<WeatherClimatePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010102";
  const cdCat01 = {
    meanTemp: "B4101",
    maxTemp: "B4102",
    minTemp: "B4103",
    precipitation: "B4109",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatisticsMetricCard
            params={{ statsDataId, cdCat01: cdCat01.meanTemp }}
            title="年平均気温"
            unit="°C"
          />
          <StatisticsMetricCard
            params={{ statsDataId, cdCat01: cdCat01.maxTemp }}
            title="最高気温"
            unit="°C"
          />
          <StatisticsMetricCard
            params={{ statsDataId, cdCat01: cdCat01.minTemp }}
            title="最低気温"
            unit="°C"
          />
          <StatisticsMetricCard
            params={{ statsDataId, cdCat01: cdCat01.precipitation }}
            title="年降水量"
            unit="mm"
          />
        </div>
      </div>

      <WeatherClimateRanking subcategory={subcategory} />
    </SubcategoryLayout>
  );
};
