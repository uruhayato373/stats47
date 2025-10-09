"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface HighSchoolRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "schoolCount"
  | "studentCount"
  | "perCapitaCount"
  | "perAreaCount"
  | "publicRatio"
  | "poolInstallationRate";

export const HighSchoolRanking: React.FC<HighSchoolRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("schoolCount");

  const rankings = {
    schoolCount: {
      statsDataId: "0000010105",
      cdCat01: "E4101",
      unit: "校",
      name: "高等学校数",
    },
    studentCount: {
      statsDataId: "0000010105",
      cdCat01: "E4201",
      unit: "人",
      name: "高等学校生徒数",
    },
    perCapitaCount: {
      statsDataId: "0000010205",
      cdCat01: "#E0110103",
      unit: "校",
      name: "高等学校数（15～17歳人口10万人当たり）",
    },
    perAreaCount: {
      statsDataId: "0000010205",
      cdCat01: "#E0110203",
      unit: "校",
      name: "高等学校数（可住地面積100km2当たり）",
    },
    publicRatio: {
      statsDataId: "0000010205",
      cdCat01: "#E01303",
      unit: "%",
      name: "公立高等学校割合",
    },
    poolInstallationRate: {
      statsDataId: "0000010205",
      cdCat01: "#E02703",
      unit: "％",
      name: "公立高等学校プール設置率",
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
              生徒数
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
            <button
              onClick={() => setActiveTab("poolInstallationRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "poolInstallationRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              プール設置率
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
