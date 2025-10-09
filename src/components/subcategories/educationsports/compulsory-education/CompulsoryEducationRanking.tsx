"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface CompulsoryEducationRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "compulsoryEducationCount"
  | "secondaryEducationCount"
  | "compulsoryEducationPerCapita"
  | "secondaryEducationPerCapita";

export const CompulsoryEducationRanking: React.FC<
  CompulsoryEducationRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "compulsoryEducationCount"
  );

  const rankings = {
    compulsoryEducationCount: {
      statsDataId: "0000010105",
      cdCat01: "E6101",
      unit: "校",
      name: "義務教育学校数",
    },
    secondaryEducationCount: {
      statsDataId: "0000010105",
      cdCat01: "E7101",
      unit: "校",
      name: "中等教育学校数",
    },
    compulsoryEducationPerCapita: {
      statsDataId: "0000010205",
      cdCat01: "#E0110107",
      unit: "校",
      name: "義務教育学校数（6～14歳人口10万人当たり）",
    },
    secondaryEducationPerCapita: {
      statsDataId: "0000010205",
      cdCat01: "#E0110108",
      unit: "校",
      name: "中等教育学校数（12～17歳人口10万人当たり）",
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
              onClick={() => setActiveTab("compulsoryEducationCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "compulsoryEducationCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              義務教育学校数
            </button>
            <button
              onClick={() => setActiveTab("secondaryEducationCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryEducationCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中等教育学校数
            </button>
            <button
              onClick={() => setActiveTab("compulsoryEducationPerCapita")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "compulsoryEducationPerCapita"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              義務教育学校（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("secondaryEducationPerCapita")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "secondaryEducationPerCapita"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中等教育学校（人口当たり）
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
