"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface LandAreaRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "totalAreaExcluding"
  | "totalAreaIncluding"
  | "habitableArea"
  | "majorLakeArea"
  | "totalAreaIncludingRatio"
  | "areaRatio"
  | "habitableAreaRatio";

export const LandAreaRanking: React.FC<LandAreaRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalAreaExcluding");

  const rankings = {
    totalAreaExcluding: {
      statsDataId: "0000010102",
      cdCat01: "B1101",
      unit: "ha",
      name: "総面積（北方地域及び竹島を除く）",
    },
    totalAreaIncluding: {
      statsDataId: "0000010102",
      cdCat01: "B1102",
      unit: "ha",
      name: "総面積（北方地域及び竹島を含む）",
    },
    habitableArea: {
      statsDataId: "0000010102",
      cdCat01: "B1103",
      unit: "ha",
      name: "可住地面積",
    },
    majorLakeArea: {
      statsDataId: "0000010102",
      cdCat01: "B1104",
      unit: "ha",
      name: "主要湖沼面積",
    },
    totalAreaIncludingRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B011001",
      unit: "100km²",
      name: "総面積（北方地域及び竹島を含む）",
    },
    areaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01101",
      unit: "%",
      name: "面積割合（全国面積に占める割合）",
    },
    habitableAreaRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01301",
      unit: "%",
      name: "可住地面積割合",
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
              onClick={() => setActiveTab("totalAreaExcluding")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAreaExcluding"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総面積（除く）
            </button>
            <button
              onClick={() => setActiveTab("totalAreaIncluding")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAreaIncluding"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総面積（含む）
            </button>
            <button
              onClick={() => setActiveTab("habitableArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "habitableArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              可住地面積
            </button>
            <button
              onClick={() => setActiveTab("majorLakeArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "majorLakeArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              主要湖沼面積
            </button>
            <button
              onClick={() => setActiveTab("totalAreaIncludingRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAreaIncludingRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総面積（100km²）
            </button>
            <button
              onClick={() => setActiveTab("areaRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "areaRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              面積割合
            </button>
            <button
              onClick={() => setActiveTab("habitableAreaRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "habitableAreaRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              可住地面積割合
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
