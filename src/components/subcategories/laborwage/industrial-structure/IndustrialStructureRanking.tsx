"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface IndustrialStructureRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "primaryIndustryRatio"
  | "secondaryIndustryRatio"
  | "tertiaryIndustryRatio"
  | "secondaryTertiaryIndustryRatio";

export const IndustrialStructureRanking: React.FC<
  IndustrialStructureRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "primaryIndustryRatio"
  );

  const rankings = {
    primaryIndustryRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01201",
      unit: "％",
      name: "第1次産業就業者比率",
    },
    secondaryIndustryRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01202",
      unit: "％",
      name: "第2次産業就業者比率",
    },
    tertiaryIndustryRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01203",
      unit: "％",
      name: "第3次産業就業者比率",
    },
    secondaryTertiaryIndustryRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01204",
      unit: "％",
      name: "第2次産業及び第3次産業就業者比率（対就業者）",
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
              onClick={() => setActiveTab("primaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "primaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第1次産業比率
            </button>
            <button
              onClick={() => setActiveTab("secondaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第2次産業比率
            </button>
            <button
              onClick={() => setActiveTab("tertiaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tertiaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第3次産業比率
            </button>
            <button
              onClick={() => setActiveTab("secondaryTertiaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryTertiaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第2次・第3次産業比率
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
