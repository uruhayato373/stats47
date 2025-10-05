
"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface NaturalEnvironmentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const NaturalEnvironmentPage: React.FC<NaturalEnvironmentPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000020201";
  const cdCat01 = {
    forest: "D3104", // 森林面積
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.forest,
            }}
            areaCode="00000"
            title="全国森林面積"
            unit="km²"
          />
        </div>
      </div>
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.forest,
        }}
        subcategory={subcategory}
      />
    </SubcategoryLayout>
  );
};
