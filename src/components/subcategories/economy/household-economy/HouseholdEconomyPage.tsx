"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface HouseholdEconomyPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const HouseholdEconomyPage: React.FC<HouseholdEconomyPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010212";
  const cdCat01 = {
    actualIncome: "#L01201",
    householdHeadIncome: "#L01204",
    consumptionExpenditure: "#L02211",
    avgPropensityToConsume: "#L02602",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.actualIncome,
            }}
            areaCode="00000"
            title="全国実収入（勤労者世帯）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.householdHeadIncome,
            }}
            areaCode="00000"
            title="全国世帯主収入（勤労者世帯）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.consumptionExpenditure,
            }}
            areaCode="00000"
            title="全国消費支出（二人以上の世帯）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgPropensityToConsume,
            }}
            areaCode="00000"
            title="全国平均消費性向（勤労者世帯）"
            color="#ef4444"
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
