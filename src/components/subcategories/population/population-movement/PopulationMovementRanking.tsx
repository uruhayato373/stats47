"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab =
  | "moversIn"
  | "moversOut"
  | "socialIncrease"
  | "dayTimePopulationRatio"
  | "dayTimePopulation"
  | "inflowPopulationInPref"
  | "inflowPopulationOtherPref"
  | "outflowPopulationInPref"
  | "outflowPopulationOtherPref";

export const PopulationMovementRanking: React.FC<
  SubcategoryRankingPageProps
> = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("moversIn");

  const rankings = {
    moversIn: {
      statsDataId: "0000010101",
      cdCat01: "A5103",
      unit: "人",
      name: "転入者数",
    },
    moversOut: {
      statsDataId: "0000010101",
      cdCat01: "A5104",
      unit: "人",
      name: "転出者数",
    },
    socialIncrease: {
      statsDataId: "0000010101",
      cdCat01: "A5302",
      unit: "人",
      name: "社会増減数",
    },
    dayTimePopulationRatio: {
      statsDataId: "0000010101",
      cdCat01: "A6108",
      unit: "%",
      name: "昼夜間人口比率",
    },
    dayTimePopulation: {
      statsDataId: "0000010101",
      cdCat01: "A6107",
      unit: "人",
      name: "昼間人口",
    },
    inflowPopulationInPref: {
      statsDataId: "0000010101",
      cdCat01: "A6105",
      unit: "人",
      name: "流入人口（県内他市区町村）",
    },
    inflowPopulationOtherPref: {
      statsDataId: "0000010101",
      cdCat01: "A6106",
      unit: "人",
      name: "流入人口（他県）",
    },
    outflowPopulationInPref: {
      statsDataId: "0000010101",
      cdCat01: "A6103",
      unit: "人",
      name: "流出人口（県内他市区町村）",
    },
    outflowPopulationOtherPref: {
      statsDataId: "0000010101",
      cdCat01: "A6104",
      unit: "人",
      name: "流出人口（他県）",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="ranking"
    >
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("moversIn")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "moversIn"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              転入者数
            </button>
            <button
              onClick={() => setActiveTab("moversOut")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "moversOut"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              転出者数
            </button>
            <button
              onClick={() => setActiveTab("socialIncrease")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "socialIncrease"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              社会増減数
            </button>
            <button
              onClick={() => setActiveTab("dayTimePopulationRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dayTimePopulationRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              昼夜間人口比率
            </button>
            <button
              onClick={() => setActiveTab("dayTimePopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dayTimePopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              昼間人口
            </button>
            <button
              onClick={() => setActiveTab("inflowPopulationInPref")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inflowPopulationInPref"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              流入（県内）
            </button>
            <button
              onClick={() => setActiveTab("inflowPopulationOtherPref")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inflowPopulationOtherPref"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              流入（他県）
            </button>
            <button
              onClick={() => setActiveTab("outflowPopulationInPref")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "outflowPopulationInPref"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              流出（県内）
            </button>
            <button
              onClick={() => setActiveTab("outflowPopulationOtherPref")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "outflowPopulationOtherPref"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              流出（他県）
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
    </SubcategoryLayout>
  );
};
