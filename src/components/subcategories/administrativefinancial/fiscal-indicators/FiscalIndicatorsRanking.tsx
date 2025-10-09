"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "revenue" | "expenditure" | "debt";

export const FiscalIndicatorsRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("revenue");

  const rankings = {
    revenue: {
      statsDataId: "0000010112",
      cdCat01: "K1101",
      unit: "百万円",
      name: "歳入",
    },
    expenditure: {
      statsDataId: "0000010112",
      cdCat01: "K1102",
      unit: "百万円",
      name: "歳出",
    },
    debt: {
      statsDataId: "0000010112",
      cdCat01: "K1103",
      unit: "百万円",
      name: "債務",
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
              onClick={() => setActiveTab("revenue")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "revenue"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              歳入
            </button>
            <button
              onClick={() => setActiveTab("expenditure")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "expenditure"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              歳出
            </button>
            <button
              onClick={() => setActiveTab("debt")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "debt"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              債務
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
          colorScheme: subcategory.colorScheme || "interpolateGreys",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
