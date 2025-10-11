"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface CommutingEmploymentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CommutingEmploymentPage: React.FC<
  CommutingEmploymentPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010206";
  const cdCat01 = {
    F2501: "F02501", // 県内就業者比率
    F260101: "F0260101", // 出稼者比率（販売農家）
    F2701: "F02701", // 他市区町村への通勤者比率
    F2702: "F02702", // 他市区町村からの通勤者比率
    F3101: "F03101", // 就職率
    F310201: "F0310201", // 県外就職者比率
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2501,
            }}
            areaCode="00000"
            title="県内就業者比率"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2701,
            }}
            areaCode="00000"
            title="他市区町村への通勤者比率"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2702,
            }}
            areaCode="00000"
            title="他市区町村からの通勤者比率"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F3101,
            }}
            areaCode="00000"
            title="就職率"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F310201,
            }}
            areaCode="00000"
            title="県外就職者比率"
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F260101,
            }}
            areaCode="00000"
            title="出稼者比率（販売農家）"
            color="#8b5cf6"
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
