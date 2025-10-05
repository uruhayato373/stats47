
"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface WeatherClimateRankingProps {
  subcategory: SubcategoryData;
}

export const WeatherClimateRanking: React.FC<WeatherClimateRankingProps> = ({
  subcategory,
}) => {
  const statsDataId = "0000010102";
  const cdCat01 = {
    meanTemp: "B4101",
    maxTemp: "B4102",
    minTemp: "B4103",
    precipitation: "B4109",
  };

  const [activeTab, setActiveTab] = useState("meanTemp");

  const rankings = {
    meanTemp: {
      cdCat01: cdCat01.meanTemp,
      unit: "°C",
      name: "年平均気温",
    },
    maxTemp: {
      cdCat01: cdCat01.maxTemp,
      unit: "°C",
      name: "最高気温",
    },
    minTemp: {
      cdCat01: cdCat01.minTemp,
      unit: "°C",
      name: "最低気温",
    },
    precipitation: {
      cdCat01: cdCat01.precipitation,
      unit: "mm",
      name: "年降水量",
    },
  };

  const activeRanking = rankings[activeTab as keyof typeof rankings];

  return (
    <>
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
              onClick={() => setActiveTab("maxTemp")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "maxTemp"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              最高気温
            </button>
            <button
              onClick={() => setActiveTab("minTemp")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "minTemp"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              最低気温
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
    </>
  );
};
