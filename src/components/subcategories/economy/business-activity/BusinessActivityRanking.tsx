"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface BusinessActivityRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "secondaryIndustryRatioCensus"
  | "tertiaryIndustryRatioCensus"
  | "secondaryIndustryRatio"
  | "tertiaryIndustryRatio";

export const BusinessActivityRanking: React.FC<
  BusinessActivityRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "secondaryIndustryRatioCensus"
  );

  const rankings = {
    secondaryIndustryRatioCensus: {
      statsDataId: "0000010203",
      cdCat01: "#C02102",
      unit: "％",
      name: "第2次産業事業所数構成比（事業所・企業統計調査結果）",
    },
    tertiaryIndustryRatioCensus: {
      statsDataId: "0000010203",
      cdCat01: "#C02103",
      unit: "％",
      name: "第3次産業事業所数構成比（事業所・企業統計調査結果）",
    },
    secondaryIndustryRatio: {
      statsDataId: "0000010203",
      cdCat01: "#C02104",
      unit: "％",
      name: "第2次産業事業所数構成比",
    },
    tertiaryIndustryRatio: {
      statsDataId: "0000010203",
      cdCat01: "#C02105",
      unit: "％",
      name: "第3次産業事業所数構成比",
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
              onClick={() => setActiveTab("secondaryIndustryRatioCensus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryIndustryRatioCensus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第2次産業（統計調査）
            </button>
            <button
              onClick={() => setActiveTab("tertiaryIndustryRatioCensus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tertiaryIndustryRatioCensus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第3次産業（統計調査）
            </button>
            <button
              onClick={() => setActiveTab("secondaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第2次産業
            </button>
            <button
              onClick={() => setActiveTab("tertiaryIndustryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tertiaryIndustryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              第3次産業
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
