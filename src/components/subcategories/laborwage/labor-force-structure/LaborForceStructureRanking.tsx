"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface LaborForceStructureRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "employedPeople"
  | "unemploymentRate"
  | "unemploymentRateMale"
  | "unemploymentRateFemale"
  | "laborForceRatioMale"
  | "laborForceRatioFemale"
  | "employedRatio"
  | "employeeRatio"
  | "dualIncomeHouseholdRatio";

export const LaborForceStructureRanking: React.FC<
  LaborForceStructureRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("employedPeople");

  const rankings = {
    employedPeople: {
      statsDataId: "0000010106",
      cdCat01: "F1102",
      unit: "人",
      name: "就業者数",
    },
    unemploymentRate: {
      statsDataId: "0000010206",
      cdCat01: "#F01301",
      unit: "%",
      name: "完全失業率",
    },
    unemploymentRateMale: {
      statsDataId: "0000010206",
      cdCat01: "#F0130101",
      unit: "%",
      name: "完全失業率（男）",
    },
    unemploymentRateFemale: {
      statsDataId: "0000010206",
      cdCat01: "#F0130102",
      unit: "%",
      name: "完全失業率（女）",
    },
    laborForceRatioMale: {
      statsDataId: "0000010206",
      cdCat01: "#F0110101",
      unit: "％",
      name: "労働力人口比率（男）",
    },
    laborForceRatioFemale: {
      statsDataId: "0000010206",
      cdCat01: "#F0110102",
      unit: "％",
      name: "労働力人口比率（女）",
    },
    employedRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01102",
      unit: "％",
      name: "就業者比率",
    },
    employeeRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F02301",
      unit: "％",
      name: "雇用者比率",
    },
    dualIncomeHouseholdRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F01503",
      unit: "％",
      name: "共働き世帯割合",
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
              onClick={() => setActiveTab("employedPeople")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employedPeople"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              就業者数
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRateMale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRateMale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率（男）
            </button>
            <button
              onClick={() => setActiveTab("unemploymentRateFemale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "unemploymentRateFemale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              完全失業率（女）
            </button>
            <button
              onClick={() => setActiveTab("laborForceRatioMale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "laborForceRatioMale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              労働力人口比率（男）
            </button>
            <button
              onClick={() => setActiveTab("laborForceRatioFemale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "laborForceRatioFemale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              労働力人口比率（女）
            </button>
            <button
              onClick={() => setActiveTab("employedRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employedRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              就業者比率
            </button>
            <button
              onClick={() => setActiveTab("employeeRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employeeRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              雇用者比率
            </button>
            <button
              onClick={() => setActiveTab("dualIncomeHouseholdRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dualIncomeHouseholdRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              共働き世帯割合
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
