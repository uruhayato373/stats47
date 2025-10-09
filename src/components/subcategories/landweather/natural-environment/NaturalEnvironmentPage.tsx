"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { NaturalEnvironmentRanking } from "./NaturalEnvironmentRanking";

interface NaturalEnvironmentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const NaturalEnvironmentPage: React.FC<NaturalEnvironmentPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010102";
  const statsDataIdRatio = "0000010202";
  const cdCat01 = {
    forestArea: "B1106", // 森林面積
    forestRatio: "#B01202", // 森林面積割合
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.forestArea,
            }}
            areaCode="00000"
            title="全国森林面積"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01.forestRatio,
            }}
            areaCode="00000"
            title="全国森林面積割合"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <NaturalEnvironmentRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
