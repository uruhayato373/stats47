"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { LandAreaRanking } from "../ranking/LandAreaRanking";

interface LandAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandAreaPage: React.FC<LandAreaPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010102";
  const cdCat01 = {
    totalArea: "B1101", // 総面積
    habitableArea: "B1103", // 可住地面積
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalArea,
            }}
            areaCode="00000"
            title="全国総面積"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.habitableArea,
            }}
            areaCode="00000"
            title="全国可住地面積"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <LandAreaRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
