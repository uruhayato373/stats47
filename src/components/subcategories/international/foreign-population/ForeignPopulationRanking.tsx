"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface ForeignPopulationRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "totalForeignPopulation"
  | "koreanForeignPopulation"
  | "chineseForeignPopulation"
  | "americanForeignPopulation";

export const ForeignPopulationRanking: React.FC<
  ForeignPopulationRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "totalForeignPopulation"
  );

  const rankings = {
    totalForeignPopulation: {
      statsDataId: "0000010201",
      cdCat01: "#A01601",
      unit: "人",
      name: "外国人人口（人口10万人当たり）",
    },
    koreanForeignPopulation: {
      statsDataId: "0000010201",
      cdCat01: "#A0160101",
      unit: "人",
      name: "韓国・朝鮮系外国人人口（人口10万人当たり）",
    },
    chineseForeignPopulation: {
      statsDataId: "0000010201",
      cdCat01: "#A0160102",
      unit: "人",
      name: "中国系外国人人口（人口10万人当たり）",
    },
    americanForeignPopulation: {
      statsDataId: "0000010201",
      cdCat01: "#A0160103",
      unit: "人",
      name: "アメリカ系外国人人口（人口10万人当たり）",
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
              onClick={() => setActiveTab("totalForeignPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalForeignPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              外国人人口総数
            </button>
            <button
              onClick={() => setActiveTab("koreanForeignPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "koreanForeignPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              韓国・朝鮮系
            </button>
            <button
              onClick={() => setActiveTab("chineseForeignPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "chineseForeignPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中国系
            </button>
            <button
              onClick={() => setActiveTab("americanForeignPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "americanForeignPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              アメリカ系
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
