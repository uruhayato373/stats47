
"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface LandUsePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandUsePage: React.FC<LandUsePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000020201";
  const cdCat01 = {
    residential: "D3102", // 宅地面積
    farmland: "D3103", // 田畑面積
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.residential,
            }}
            areaCode="00000"
            title="全国宅地面積"
            unit="km²"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.farmland,
            }}
            areaCode="00000"
            title="全国田畑面積"
            unit="km²"
          />
        </div>
      </div>
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.residential,
        }}
        subcategory={subcategory}
      />
    </SubcategoryLayout>
  );
};
