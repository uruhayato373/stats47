"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab = "fireIncidents" | "fireDamage" | "insuranceClaims";

export const FireInsuranceRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("fireIncidents");

  const rankings = {
    fireIncidents: {
      statsDataId: "0000010157",
      cdCat01: "DDD1101",
      unit: "件",
      name: "火災件数",
    },
    fireDamage: {
      statsDataId: "0000010157",
      cdCat01: "DDD1102",
      unit: "千円",
      name: "火災損害額",
    },
    insuranceClaims: {
      statsDataId: "0000010157",
      cdCat01: "DDD1103",
      unit: "千円",
      name: "保険金支払額",
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
              onClick={() => setActiveTab("fireIncidents")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireIncidents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災件数
            </button>
            <button
              onClick={() => setActiveTab("fireDamage")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDamage"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災損害額
            </button>
            <button
              onClick={() => setActiveTab("insuranceClaims")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "insuranceClaims"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保険金支払額
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
