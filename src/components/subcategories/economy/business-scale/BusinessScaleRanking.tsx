"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface BusinessScaleRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab = "establishmentRatio1to4" | "establishmentRatio5to9";

export const BusinessScaleRanking: React.FC<BusinessScaleRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "establishmentRatio1to4"
  );

  const rankings = {
    establishmentRatio1to4: {
      statsDataId: "0000010203",
      cdCat01: "#C02206",
      unit: "％",
      name: "従業者1～4人の事業所割合（民営）",
    },
    establishmentRatio5to9: {
      statsDataId: "0000010203",
      cdCat01: "#C02207",
      unit: "％",
      name: "従業者5～9人の事業所割合（民営）",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("establishmentRatio1to4")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "establishmentRatio1to4"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              従業者1～4人
            </button>
            <button
              onClick={() => setActiveTab("establishmentRatio5to9")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "establishmentRatio5to9"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              従業者5～9人
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
