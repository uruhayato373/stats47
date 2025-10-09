"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface KindergartenRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "kindergartenCount"
  | "enrollmentCount"
  | "perCapitaCount"
  | "publicRatio";

export const KindergartenRanking: React.FC<KindergartenRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("kindergartenCount");

  const rankings = {
    kindergartenCount: {
      statsDataId: "0000010105",
      cdCat01: "E1101",
      unit: "園",
      name: "幼稚園数",
    },
    enrollmentCount: {
      statsDataId: "0000010105",
      cdCat01: "E1201",
      unit: "人",
      name: "幼稚園在園者数",
    },
    perCapitaCount: {
      statsDataId: "0000010205",
      cdCat01: "#E0110104",
      unit: "園",
      name: "幼稚園数（3～5歳人口10万人当たり）",
    },
    publicRatio: {
      statsDataId: "0000010205",
      cdCat01: "#E01304",
      unit: "％",
      name: "公立幼稚園割合",
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
              onClick={() => setActiveTab("kindergartenCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "kindergartenCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              幼稚園数
            </button>
            <button
              onClick={() => setActiveTab("enrollmentCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "enrollmentCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              在園者数
            </button>
            <button
              onClick={() => setActiveTab("perCapitaCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perCapitaCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              人口当たり数
            </button>
            <button
              onClick={() => setActiveTab("publicRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              公立割合
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
