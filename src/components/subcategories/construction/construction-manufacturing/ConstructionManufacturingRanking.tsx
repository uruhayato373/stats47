"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "constructionValue" | "manufacturingValue" | "employment";

export const ConstructionManufacturingRanking: React.FC<
  SubcategoryRankingPageProps
> = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("constructionValue");

  const rankings = {
    constructionValue: {
      statsDataId: "0000010140",
      cdCat01: "MM1101",
      unit: "百万円",
      name: "建設投資額",
    },
    manufacturingValue: {
      statsDataId: "0000010140",
      cdCat01: "MM1102",
      unit: "百万円",
      name: "製造業生産額",
    },
    employment: {
      statsDataId: "0000010140",
      cdCat01: "MM1103",
      unit: "人",
      name: "従業者数",
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
              onClick={() => setActiveTab("constructionValue")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "constructionValue"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              建設投資額
            </button>
            <button
              onClick={() => setActiveTab("manufacturingValue")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "manufacturingValue"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              製造業生産額
            </button>
            <button
              onClick={() => setActiveTab("employment")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employment"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              従業者数
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
          colorScheme: subcategory.colorScheme || "interpolateOranges",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
