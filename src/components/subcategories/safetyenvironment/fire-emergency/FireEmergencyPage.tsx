"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { FireEmergencyRanking } from "./FireEmergencyRanking";

interface FireEmergencyPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const FireEmergencyPage: React.FC<FireEmergencyPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010111";
  const cdCat01 = {
    K1101: "K1101",
    K1210: "K1210",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K1101,
            }}
            areaCode="00000"
            title="全国消防本部・署数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K1210,
            }}
            areaCode="00000"
            title="全国救急出動件数"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <FireEmergencyRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
