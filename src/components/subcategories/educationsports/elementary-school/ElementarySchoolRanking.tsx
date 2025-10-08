"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface ElementarySchoolRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "schoolCount"
  | "studentCount"
  | "perCapitaCount"
  | "perAreaCount";

export const ElementarySchoolRanking: React.FC<
  ElementarySchoolRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("schoolCount");

  const rankings = {
    schoolCount: {
      statsDataId: "0000010105",
      cdCat01: "E2101",
      unit: "校",
      name: "小学校数",
    },
    studentCount: {
      statsDataId: "0000010105",
      cdCat01: "E2201",
      unit: "人",
      name: "小学校児童数",
    },
    perCapitaCount: {
      statsDataId: "0000010205",
      cdCat01: "#E0110101",
      unit: "校",
      name: "小学校数（6～11歳人口10万人当たり）",
    },
    perAreaCount: {
      statsDataId: "0000010205",
      cdCat01: "#E0110201",
      unit: "校",
      name: "小学校数（可住地面積100km2当たり）",
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
              onClick={() => setActiveTab("schoolCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "schoolCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              学校数
            </button>
            <button
              onClick={() => setActiveTab("studentCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "studentCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              児童数
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
              onClick={() => setActiveTab("perAreaCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perAreaCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              面積当たり数
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
