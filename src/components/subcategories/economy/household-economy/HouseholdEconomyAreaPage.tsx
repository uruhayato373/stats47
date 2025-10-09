"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface HouseholdEconomyAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  currentYear: string;
}

export const HouseholdEconomyAreaPage: React.FC<
  HouseholdEconomyAreaPageProps
> = ({ category, subcategory, areaCode }) => {
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
            areaCode={areaCode}
            title="実収入（勤労者世帯）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.householdHeadIncome,
            }}
            areaCode={areaCode}
            title="世帯主収入（勤労者世帯）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.consumptionExpenditure,
            }}
            areaCode={areaCode}
            title="消費支出（二人以上の世帯）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgPropensityToConsume,
            }}
            areaCode={areaCode}
            title="平均消費性向（勤労者世帯）"
            color="#ef4444"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
