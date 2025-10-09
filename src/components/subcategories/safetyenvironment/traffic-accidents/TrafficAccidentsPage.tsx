"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { TrafficAccidentsRanking } from "./TrafficAccidentsRanking";

interface TrafficAccidentsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const TrafficAccidentsPage: React.FC<TrafficAccidentsPageProps> = ({
  category,
  subcategory,
}) => {
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
            areaCode="00000"
            title="全国交通事故発生件数（人口10万人当たり）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.accidentCountPerRoadLength,
            }}
            areaCode="00000"
            title="全国交通事故発生件数（道路実延長千km当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.casualtiesPerPopulation,
            }}
            areaCode="00000"
            title="全国交通事故死傷者数（人口10万人当たり）"
            color="#dc2626"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <TrafficAccidentsRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
