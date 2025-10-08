"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface GrossProductEconomicIndicatorsRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "perCapitaIncomeH17"
  | "perCapitaIncomeH23"
  | "perCapitaIncomeH27";

export const GrossProductEconomicIndicatorsRanking: React.FC<
  GrossProductEconomicIndicatorsRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("perCapitaIncomeH27");

  const rankings = {
    perCapitaIncomeH17: {
      statsDataId: "0000010203",
      cdCat01: "#C01301",
      unit: "千円",
      name: "1人当たり県民所得（平成17年基準）",
    },
    perCapitaIncomeH23: {
      statsDataId: "0000010203",
      cdCat01: "#C01311",
      unit: "千円",
      name: "1人当たり県民所得（平成23年基準）",
    },
    perCapitaIncomeH27: {
      statsDataId: "0000010203",
      cdCat01: "#C01321",
      unit: "千円",
      name: "1人当たり県民所得（平成27年基準）",
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
              onClick={() => setActiveTab("perCapitaIncomeH17")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perCapitaIncomeH17"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平成17年基準
            </button>
            <button
              onClick={() => setActiveTab("perCapitaIncomeH23")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perCapitaIncomeH23"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平成23年基準
            </button>
            <button
              onClick={() => setActiveTab("perCapitaIncomeH27")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "perCapitaIncomeH27"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平成27年基準
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
