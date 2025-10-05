
"use client";

import React, { useState } from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface WeatherClimatePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WeatherClimatePage: React.FC<WeatherClimatePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000020204";
  const cdCat01 = {
    meanTemp: "E5101", // 年平均気温
    precipitation: "E5104", // 年降水量
  };

  const [activeTab, setActiveTab] = useState("meanTemp");

  const rankings = {
    meanTemp: {
      cdCat01: cdCat01.meanTemp,
      unit: "°C",
      name: "年平均気温",
    },
    precipitation: {
      cdCat01: cdCat01.precipitation,
      unit: "mm",
      name: "年降水量",
    },
  };

  const activeRanking =
    activeTab === "meanTemp" ? rankings.meanTemp : rankings.precipitation;

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.meanTemp,
            }}
            areaCode="01100" // Sapporo
            title="札幌市の年平均気温"
            unit="°C"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.precipitation,
            }}
            areaCode="01100" // Sapporo
            title="札幌市の年降水量"
            unit="mm"
          />
        </div>
      </div>

      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("meanTemp")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "meanTemp"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              年平均気温
            </button>
            <button
              onClick={() => setActiveTab("precipitation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "precipitation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              年降水量
            </button>
          </nav>
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: activeRanking.cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: activeRanking.unit,
          name: activeRanking.name,
        }}
      />
    </SubcategoryLayout>
  );
};
