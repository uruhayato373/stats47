"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface HouseholdsRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab = "totalHouseholds" | "nuclearFamilyHouseholds" | "averageSize";

export const HouseholdsRanking: React.FC<HouseholdsRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalHouseholds");

  const rankings = {
    totalHouseholds: {
      statsDataId: "0000010108",
      cdCat01: "H3100",
      unit: "世帯",
      name: "総世帯数",
    },
    nuclearFamilyHouseholds: {
      statsDataId: "0000010101",
      cdCat01: "A810102",
      unit: "世帯",
      name: "核家族世帯数",
    },
    averageSize: {
      statsDataId: "0000010201",
      cdCat01: "#A06102",
      unit: "人",
      name: "一般世帯平均人員",
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
              onClick={() => setActiveTab("totalHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総世帯数
            </button>
            <button
              onClick={() => setActiveTab("nuclearFamilyHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nuclearFamilyHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              核家族世帯数
            </button>
            <button
              onClick={() => setActiveTab("averageSize")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "averageSize"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              世帯平均人員
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
          colorScheme:
            activeTab === "averageSize"
              ? "interpolateRdYlBu"
              : "interpolateViridis",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
