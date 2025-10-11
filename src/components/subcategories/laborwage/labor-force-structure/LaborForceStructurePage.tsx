"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface LaborForceStructurePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LaborForceStructurePage: React.FC<
  LaborForceStructurePageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010106";
  const cdCat01 = {
    F1101: "F1101",
    F1102: "F1102",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1101,
            }}
            areaCode="00000"
            title="全国労働力人口"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1102,
            }}
            areaCode="00000"
            title="全国就業者数"
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
