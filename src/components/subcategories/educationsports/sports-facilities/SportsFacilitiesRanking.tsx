"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface SportsFacilitiesRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "communitySports"
  | "multipurposeGround"
  | "gymnasium"
  | "swimmingPool"
  | "sportsParticipation";

export const SportsFacilitiesRanking: React.FC<
  SportsFacilitiesRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("communitySports");

  const rankings = {
    communitySports: {
      statsDataId: "0000010207",
      cdCat01: "#G01321",
      unit: "施設",
      name: "社会体育施設数（人口100万人当たり）",
    },
    multipurposeGround: {
      statsDataId: "0000010207",
      cdCat01: "#G01323",
      unit: "施設",
      name: "多目的運動広場数（公共）（人口100万人当たり）",
    },
    gymnasium: {
      statsDataId: "0000010207",
      cdCat01: "#G01325",
      unit: "施設",
      name: "体育館数（公共）（人口100万人当たり）",
    },
    swimmingPool: {
      statsDataId: "0000010207",
      cdCat01: "#G01326",
      unit: "施設",
      name: "水泳プール数（屋内，屋外）（公共）（人口100万人当たり）",
    },
    sportsParticipation: {
      statsDataId: "0000010207",
      cdCat01: "#G042111",
      unit: "%",
      name: "スポーツの年間行動者率（10歳以上）",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("communitySports")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "communitySports"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              社会体育施設
            </button>
            <button
              onClick={() => setActiveTab("multipurposeGround")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "multipurposeGround"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              多目的運動広場
            </button>
            <button
              onClick={() => setActiveTab("gymnasium")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "gymnasium"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              体育館
            </button>
            <button
              onClick={() => setActiveTab("swimmingPool")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "swimmingPool"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              水泳プール
            </button>
            <button
              onClick={() => setActiveTab("sportsParticipation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sportsParticipation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              スポーツ参加率
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
    </>
  );
};
