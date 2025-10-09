"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface NaturalEnvironmentRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "forestArea"
  | "forestAreaRatio"
  | "natureParkAreaRatio"
  | "woodlandArea"
  | "nonForestGrasslandArea"
  | "naturalEnvironmentConservationArea";

export const NaturalEnvironmentRanking: React.FC<
  NaturalEnvironmentRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("forestArea");

  const rankings = {
    forestArea: {
      statsDataId: "0000010102",
      cdCat01: "B1105",
      unit: "ha",
      name: "林野面積",
    },
    woodlandArea: {
      statsDataId: "0000010102",
      cdCat01: "B1106",
      unit: "ha",
      name: "森林面積",
    },
    nonForestGrasslandArea: {
      statsDataId: "0000010102",
      cdCat01: "B1107",
      unit: "ha",
      name: "森林以外の草生地面積",
    },
    naturalEnvironmentConservationArea: {
      statsDataId: "0000010102",
      cdCat01: "B1108",
      unit: "ha",
      name: "自然環境保全地域面積",
    },
    forestAreaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01202",
      unit: "%",
      name: "森林面積割合",
    },
    natureParkAreaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01204",
      unit: "%",
      name: "自然公園面積割合",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("forestArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "forestArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              林野面積
            </button>
            <button
              onClick={() => setActiveTab("woodlandArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "woodlandArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              森林面積
            </button>
            <button
              onClick={() => setActiveTab("nonForestGrasslandArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nonForestGrasslandArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              草生地面積
            </button>
            <button
              onClick={() => setActiveTab("naturalEnvironmentConservationArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "naturalEnvironmentConservationArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保全地域面積
            </button>
            <button
              onClick={() => setActiveTab("forestAreaRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "forestAreaRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              森林面積割合
            </button>
            <button
              onClick={() => setActiveTab("natureParkAreaRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "natureParkAreaRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              自然公園面積割合
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
          colorScheme: subcategory.colorScheme || "interpolateGreens",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
