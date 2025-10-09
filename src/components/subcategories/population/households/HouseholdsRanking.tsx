"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab =
  | "totalHouseholds"
  | "averageHouseholdSize"
  | "nuclearFamilyHouseholds"
  | "singlePersonHouseholds";

export const HouseholdsRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalHouseholds");

  const rankings = {
    totalHouseholds: {
      statsDataId: "0000010101",
      cdCat01: "A3101",
      unit: "世帯",
      name: "総世帯数",
    },
    averageHouseholdSize: {
      statsDataId: "0000010101",
      cdCat01: "A3102",
      unit: "人",
      name: "平均世帯人員",
    },
    nuclearFamilyHouseholds: {
      statsDataId: "0000010101",
      cdCat01: "A3103",
      unit: "世帯",
      name: "核家族世帯数",
    },
    singlePersonHouseholds: {
      statsDataId: "0000010101",
      cdCat01: "A3104",
      unit: "世帯",
      name: "単独世帯数",
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
              onClick={() => setActiveTab("totalHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総世帯数
            </button>
            <button
              onClick={() => setActiveTab("averageHouseholdSize")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "averageHouseholdSize"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均世帯人員
            </button>
            <button
              onClick={() => setActiveTab("nuclearFamilyHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nuclearFamilyHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              核家族世帯数
            </button>
            <button
              onClick={() => setActiveTab("singlePersonHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "singlePersonHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              単独世帯数
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
