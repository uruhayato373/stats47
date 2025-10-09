"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "airPollution" | "waterPollution" | "wasteDisposal";

export const PollutionEnvironmentRanking: React.FC<
  SubcategoryRankingPageProps
> = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("airPollution");

  const rankings = {
    airPollution: {
      statsDataId: "0000010159",
      cdCat01: "FFF1101",
      unit: "μg/m³",
      name: "大気汚染",
    },
    waterPollution: {
      statsDataId: "0000010159",
      cdCat01: "FFF1102",
      unit: "mg/L",
      name: "水質汚濁",
    },
    wasteDisposal: {
      statsDataId: "0000010159",
      cdCat01: "FFF1103",
      unit: "t",
      name: "廃棄物処理",
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
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("airPollution")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "airPollution"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              大気汚染
            </button>
            <button
              onClick={() => setActiveTab("waterPollution")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "waterPollution"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              水質汚濁
            </button>
            <button
              onClick={() => setActiveTab("wasteDisposal")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "wasteDisposal"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              廃棄物処理
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
          colorScheme: subcategory.colorScheme || "interpolateReds",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
