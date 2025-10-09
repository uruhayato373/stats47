"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "retailStores" | "restaurants" | "hotels";

export const CommercialFacilitiesRanking: React.FC<
  SubcategoryRankingPageProps
> = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("retailStores");

  const rankings = {
    retailStores: {
      statsDataId: "0000010106",
      cdCat01: "E2101",
      unit: "店舗",
      name: "小売店舗数",
    },
    restaurants: {
      statsDataId: "0000010106",
      cdCat01: "E2102",
      unit: "店舗",
      name: "飲食店数",
    },
    hotels: {
      statsDataId: "0000010106",
      cdCat01: "E2103",
      unit: "施設",
      name: "宿泊施設数",
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
              onClick={() => setActiveTab("retailStores")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "retailStores"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              小売店舗数
            </button>
            <button
              onClick={() => setActiveTab("restaurants")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "restaurants"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              飲食店数
            </button>
            <button
              onClick={() => setActiveTab("hotels")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "hotels"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              宿泊施設数
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
          colorScheme: subcategory.colorScheme || "interpolatePurples",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
