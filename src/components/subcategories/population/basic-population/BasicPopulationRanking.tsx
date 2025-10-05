"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface BasicPopulationRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab = "totalPopulation" | "populationDensity" | "didAreaRatio";

export const BasicPopulationRanking: React.FC<BasicPopulationRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalPopulation");

  const rankings = {
    totalPopulation: {
      statsDataId: "0000010101",
      cdCat01: "A1101",
      unit: "人",
      name: "総人口",
    },
    populationDensity: {
      statsDataId: "0000010201",
      cdCat01: "#A01201",
      unit: "人/km²",
      name: "人口密度",
    },
    didAreaRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01402",
      unit: "%",
      name: "人口集中地区面積比率",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("totalPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総人口
            </button>
            <button
              onClick={() => setActiveTab("populationDensity")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "populationDensity"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口密度
            </button>
            <button
              onClick={() => setActiveTab("didAreaRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "didAreaRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口集中地区面積比率
            </button>
          </nav>
        </div>
      </div>

      {/* コロプレス地図とデータテーブル */}
      <EstatRanking
        params={{
          statsDataId: activeRanking.statsDataId,
          cdCat01: activeRanking.cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: activeRanking.unit,
          name: activeRanking.name,
        }}
        options={{
          colorScheme: subcategory.colorScheme || "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
