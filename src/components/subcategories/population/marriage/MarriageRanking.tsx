"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "marriages" | "divorces" | "marriageRate" | "divorceRate";

export const MarriageRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("marriages");

  const rankings = {
    marriages: {
      statsDataId: "0000010101",
      cdCat01: "A2101",
      unit: "件",
      name: "婚姻件数",
    },
    divorces: {
      statsDataId: "0000010101",
      cdCat01: "A2102",
      unit: "件",
      name: "離婚件数",
    },
    marriageRate: {
      statsDataId: "0000010101",
      cdCat01: "A2103",
      unit: "‰",
      name: "婚姻率",
    },
    divorceRate: {
      statsDataId: "0000010101",
      cdCat01: "A2104",
      unit: "‰",
      name: "離婚率",
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
              onClick={() => setActiveTab("marriages")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "marriages"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              婚姻件数
            </button>
            <button
              onClick={() => setActiveTab("divorces")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "divorces"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              離婚件数
            </button>
            <button
              onClick={() => setActiveTab("marriageRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "marriageRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              婚姻率
            </button>
            <button
              onClick={() => setActiveTab("divorceRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "divorceRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              離婚率
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
