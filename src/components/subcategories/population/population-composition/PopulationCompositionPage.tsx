"use client";

import React from "react";

import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { EstatStackedBarChart } from "@/components/dashboard/StackedBarChart";

interface PopulationCompositionPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const PopulationCompositionPage: React.FC<
  PopulationCompositionPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010101";
  const ageCompositionCodes = ["A1301", "A1302", "A1303"]; // 15歳未満, 15-64歳, 65歳以上

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="p-4">
        <EstatStackedBarChart
          params={{
            statsDataId: statsDataId,
            cdCat01: ageCompositionCodes,
          }}
          title="年齢3区分別人口の推移"
          yLabel="人口（人）"
        />
      </div>
    </SubcategoryLayout>
  );
};