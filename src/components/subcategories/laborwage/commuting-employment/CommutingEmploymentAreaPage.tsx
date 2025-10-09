"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface CommutingEmploymentAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
}

export const CommutingEmploymentAreaPage: React.FC<
  CommutingEmploymentAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の通勤・就職
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2501,
            }}
            areaCode={areaCode}
            title="県内就業者比率"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2701,
            }}
            areaCode={areaCode}
            title="他市区町村への通勤者比率"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F2702,
            }}
            areaCode={areaCode}
            title="他市区町村からの通勤者比率"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F3101,
            }}
            areaCode={areaCode}
            title="就職率"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F310201,
            }}
            areaCode={areaCode}
            title="県外就職者比率"
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F260101,
            }}
            areaCode={areaCode}
            title="出稼者比率（販売農家）"
            color="#8b5cf6"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
