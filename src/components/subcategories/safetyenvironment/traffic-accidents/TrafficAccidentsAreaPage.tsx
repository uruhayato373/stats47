"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface TrafficAccidentsAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  currentYear: string;
}

export const TrafficAccidentsAreaPage: React.FC<
  TrafficAccidentsAreaPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010211";
  const cdCat01 = {
    accidentCountPerPopulation: "#K04101",
    accidentCountPerRoadLength: "#K04102",
    casualtiesPerPopulation: "#K04105",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.accidentCountPerPopulation,
            }}
            areaCode={areaCode}
            title="交通事故発生件数（人口10万人当たり）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.accidentCountPerRoadLength,
            }}
            areaCode={areaCode}
            title="交通事故発生件数（道路実延長千km当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.casualtiesPerPopulation,
            }}
            areaCode={areaCode}
            title="交通事故死傷者数（人口10万人当たり）"
            color="#dc2626"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
