"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "largeEnterprises" | "mediumEnterprises" | "smallEnterprises";

export const BusinessScaleRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("largeEnterprises");

  const rankings = {
    largeEnterprises: {
      statsDataId: "0000010120",
      cdCat01: "S1101",
      unit: "社",
      name: "大企業数",
    },
    mediumEnterprises: {
      statsDataId: "0000010120",
      cdCat01: "S1102",
      unit: "社",
      name: "中企業数",
    },
    smallEnterprises: {
      statsDataId: "0000010120",
      cdCat01: "S1103",
      unit: "社",
      name: "小企業数",
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
              onClick={() => setActiveTab("largeEnterprises")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "largeEnterprises"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              大企業数
            </button>
            <button
              onClick={() => setActiveTab("mediumEnterprises")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mediumEnterprises"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中企業数
            </button>
            <button
              onClick={() => setActiveTab("smallEnterprises")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "smallEnterprises"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              小企業数
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
