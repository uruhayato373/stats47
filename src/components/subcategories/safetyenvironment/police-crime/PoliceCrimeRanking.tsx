"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "crimes" | "arrests" | "policeOfficers";

export const PoliceCrimeRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("crimes");

  const rankings = {
    crimes: {
      statsDataId: "0000010158",
      cdCat01: "EEE1101",
      unit: "件",
      name: "犯罪件数",
    },
    arrests: {
      statsDataId: "0000010158",
      cdCat01: "EEE1102",
      unit: "件",
      name: "検挙件数",
    },
    policeOfficers: {
      statsDataId: "0000010158",
      cdCat01: "EEE1103",
      unit: "人",
      name: "警察官数",
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
              onClick={() => setActiveTab("crimes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "crimes"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              犯罪件数
            </button>
            <button
              onClick={() => setActiveTab("arrests")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "arrests"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              検挙件数
            </button>
            <button
              onClick={() => setActiveTab("policeOfficers")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "policeOfficers"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              警察官数
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
