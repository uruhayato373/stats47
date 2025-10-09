"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface SocialActivitiesRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "volunteer15plus"
  | "volunteer10plus"
  | "sports10plus"
  | "travel15plus"
  | "travel10plus"
  | "overseasTravel"
  | "passportIssuance";

export const SocialActivitiesRanking: React.FC<
  SocialActivitiesRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("volunteer15plus");

  const rankings = {
    volunteer15plus: {
      statsDataId: "0000010207",
      cdCat01: "#G04101",
      unit: "％",
      name: "ボランティア活動の年間行動者率（15歳以上）",
    },
    volunteer10plus: {
      statsDataId: "0000010207",
      cdCat01: "#G041011",
      unit: "％",
      name: "ボランティア活動の年間行動者率（10歳以上）",
    },
    sports10plus: {
      statsDataId: "0000010207",
      cdCat01: "#G042111",
      unit: "％",
      name: "スポーツの年間行動者率（10歳以上）",
    },
    travel15plus: {
      statsDataId: "0000010207",
      cdCat01: "#G04306",
      unit: "％",
      name: "旅行・行楽の年間行動者率（15歳以上）",
    },
    travel10plus: {
      statsDataId: "0000010207",
      cdCat01: "#G043061",
      unit: "％",
      name: "旅行・行楽の年間行動者率（10歳以上）",
    },
    overseasTravel: {
      statsDataId: "0000010207",
      cdCat01: "#G04307",
      unit: "％",
      name: "海外旅行の年間行動者率（15歳以上）",
    },
    passportIssuance: {
      statsDataId: "0000010207",
      cdCat01: "#G0430501",
      unit: "件",
      name: "一般旅券発行件数（人口千人当たり）",
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
              onClick={() => setActiveTab("volunteer15plus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "volunteer15plus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ボランティア（15歳以上）
            </button>
            <button
              onClick={() => setActiveTab("volunteer10plus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "volunteer10plus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ボランティア（10歳以上）
            </button>
            <button
              onClick={() => setActiveTab("sports10plus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sports10plus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              スポーツ（10歳以上）
            </button>
            <button
              onClick={() => setActiveTab("travel15plus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "travel15plus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              旅行・行楽（15歳以上）
            </button>
            <button
              onClick={() => setActiveTab("travel10plus")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "travel10plus"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              旅行・行楽（10歳以上）
            </button>
            <button
              onClick={() => setActiveTab("overseasTravel")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overseasTravel"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              海外旅行（15歳以上）
            </button>
            <button
              onClick={() => setActiveTab("passportIssuance")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "passportIssuance"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              旅券発行件数
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
