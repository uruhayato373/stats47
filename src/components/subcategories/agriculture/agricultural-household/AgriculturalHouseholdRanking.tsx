"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface AgriculturalHouseholdRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "agriculturalOutput"
  | "farmCount"
  | "commercialFarmCount"
  | "subsistenceFarmCount"
  | "fulltimeFarmCount"
  | "parttimeFarmCount"
  | "farmIncome"
  | "agriculturalIncomeRatio"
  | "farmExpenditure"
  | "farmConsumptionPropensity";

export const AgriculturalHouseholdRanking: React.FC<
  AgriculturalHouseholdRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("agriculturalOutput");

  const rankings = {
    agriculturalOutput: {
      statsDataId: "0000010103",
      cdCat01: "C3101",
      unit: "百万円",
      name: "農業産出額",
    },
    farmCount: {
      statsDataId: "0000010103",
      cdCat01: "C3102",
      unit: "戸",
      name: "農家数",
    },
    commercialFarmCount: {
      statsDataId: "0000010103",
      cdCat01: "C310201",
      unit: "戸",
      name: "農家数（販売農家）",
    },
    subsistenceFarmCount: {
      statsDataId: "0000010103",
      cdCat01: "C310202",
      unit: "戸",
      name: "農家数（自給的農家）",
    },
    fulltimeFarmCount: {
      statsDataId: "0000010103",
      cdCat01: "C310211",
      unit: "戸",
      name: "専業農家数（販売農家）",
    },
    parttimeFarmCount: {
      statsDataId: "0000010103",
      cdCat01: "C310212",
      unit: "戸",
      name: "兼業農家数（販売農家）",
    },
    farmIncome: {
      statsDataId: "0000010212",
      cdCat01: "#L01100",
      unit: "千円",
      name: "農家総所得",
    },
    agriculturalIncomeRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L0110101",
      unit: "%",
      name: "農業所得割合",
    },
    farmExpenditure: {
      statsDataId: "0000010212",
      cdCat01: "#L02101",
      unit: "千円",
      name: "農家世帯の家計費（1世帯当たり1か月間）",
    },
    farmConsumptionPropensity: {
      statsDataId: "0000010212",
      cdCat01: "#L02601",
      unit: "%",
      name: "農家世帯の平均消費性向",
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
              onClick={() => setActiveTab("agriculturalOutput")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agriculturalOutput"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農業産出額
            </button>
            <button
              onClick={() => setActiveTab("farmCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "farmCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農家数
            </button>
            <button
              onClick={() => setActiveTab("commercialFarmCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commercialFarmCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              販売農家数
            </button>
            <button
              onClick={() => setActiveTab("subsistenceFarmCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subsistenceFarmCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              自給的農家数
            </button>
            <button
              onClick={() => setActiveTab("fulltimeFarmCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fulltimeFarmCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              専業農家数
            </button>
            <button
              onClick={() => setActiveTab("parttimeFarmCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "parttimeFarmCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              兼業農家数
            </button>
            <button
              onClick={() => setActiveTab("farmIncome")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "farmIncome"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農家総所得
            </button>
            <button
              onClick={() => setActiveTab("agriculturalIncomeRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agriculturalIncomeRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農業所得割合
            </button>
            <button
              onClick={() => setActiveTab("farmExpenditure")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "farmExpenditure"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農家家計費
            </button>
            <button
              onClick={() => setActiveTab("farmConsumptionPropensity")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "farmConsumptionPropensity"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農家消費性向
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
