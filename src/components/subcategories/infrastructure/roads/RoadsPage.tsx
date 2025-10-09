"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { RoadsRanking } from "./RoadsRanking";

interface RoadsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const RoadsPage: React.FC<RoadsPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010108";
  const cdCat01 = {
    totalRoadLength: "H7110",
    majorRoadLength: "H7111",
    municipalRoadLength: "H7112",
    expresswayLength: "H7113",
    pavedRoadLength: "H7120",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalRoadLength,
            }}
            areaCode="00000"
            title="全国道路実延長"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.majorRoadLength,
            }}
            areaCode="00000"
            title="全国主要道路実延長"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.municipalRoadLength,
            }}
            areaCode="00000"
            title="全国市町村道実延長"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.expresswayLength,
            }}
            areaCode="00000"
            title="全国高速道路実延長"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.pavedRoadLength,
            }}
            areaCode="00000"
            title="全国舗装道路実延長"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <RoadsRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
