"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface LaborForceStructureRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "employedPeople"
  | "unemploymentRate"
  | "unemploymentRateMale"
  | "unemploymentRateFemale";

export const LaborForceStructureRanking: React.FC<
  LaborForceStructureRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("employedPeople");

  const rankings = {
    employedPeople: {
      statsDataId: "0000010106",
      cdCat01: "F1102",
      unit: "人",
      name: "就業者数",
    },
    unemploymentRate: {
      statsDataId: "0000010206",
      cdCat01: "#F01301",
      unit: "%",
      name: "完全失業率",
    },
    unemploymentRateMale: {
      statsDataId: "0000010206",
      cdCat01: "#F0130101",
      unit: "%",
      name: "完全失業率（男）",
    },
    unemploymentRateFemale: {
      statsDataId: "0000010206",
      cdCat01: "#F0130102",
      unit: "%",
      name: "完全失業率（女）",
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
              onClick={() => setActiveTab("employedPeople")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employedPeople"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              就業者数
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRateMale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRateMale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率（男）
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRateFemale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRateFemale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率（女）
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
