"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface PopulationCompositionRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "youngPopulation"
  | "workingAgePopulation"
  | "elderlyPopulation"
  | "sexRatio";

export const PopulationCompositionRanking: React.FC<
  PopulationCompositionRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("youngPopulation");

  const rankings = {
    youngPopulation: {
      statsDataId: "0000010101",
      cdCat01: "A1301",
      unit: "%",
      name: "15歳未満人口割合",
    },
    workingAgePopulation: {
      statsDataId: "0000010101",
      cdCat01: "A1302",
      unit: "%",
      name: "15-64歳人口割合",
    },
    elderlyPopulation: {
      statsDataId: "0000010101",
      cdCat01: "A1303",
      unit: "%",
      name: "65歳以上人口割合",
    },
    sexRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A02101",
      unit: "-",
      name: "人口性比（総数）",
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
              onClick={() => setActiveTab("youngPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "youngPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              15歳未満人口割合
            </button>
            <button
              onClick={() => setActiveTab("workingAgePopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "workingAgePopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              15-64歳人口割合
            </button>
            <button
              onClick={() => setActiveTab("elderlyPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "elderlyPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              65歳以上人口割合
            </button>
            <button
              onClick={() => setActiveTab("sexRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sexRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口性比
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
        title={`${activeRanking.name}ランキング`}
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
