"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface LandUseRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "totalAssessedLandArea"
  | "paddyFieldArea"
  | "fieldArea"
  | "residentialLandArea"
  | "totalAssessedLandRatio"
  | "paddyFieldRatio"
  | "fieldRatio"
  | "residentialLandRatio";

export const LandUseRanking: React.FC<LandUseRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "totalAssessedLandArea"
  );

  const rankings = {
    totalAssessedLandArea: {
      statsDataId: "0000010102",
      cdCat01: "B1201",
      unit: "m²",
      name: "評価総地積（課税対象土地）",
    },
    paddyFieldArea: {
      statsDataId: "0000010102",
      cdCat01: "B120101",
      unit: "m²",
      name: "評価総地積（田）",
    },
    fieldArea: {
      statsDataId: "0000010102",
      cdCat01: "B120102",
      unit: "m²",
      name: "評価総地積（畑）",
    },
    residentialLandArea: {
      statsDataId: "0000010102",
      cdCat01: "B120103",
      unit: "m²",
      name: "評価総地積（宅地）",
    },
    totalAssessedLandRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B01401",
      unit: "%",
      name: "評価総地積割合（課税対象土地）",
    },
    paddyFieldRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B0140101",
      unit: "%",
      name: "評価総地積割合（田）",
    },
    fieldRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B0140102",
      unit: "%",
      name: "評価総地積割合（畑）",
    },
    residentialLandRatio: {
      statsDataId: "0000010202",
      cdCat01: "#B0140103",
      unit: "%",
      name: "評価総地積割合（宅地）",
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
              onClick={() => setActiveTab("totalAssessedLandArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAssessedLandArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総地積
            </button>
            <button
              onClick={() => setActiveTab("paddyFieldArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "paddyFieldArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              田面積
            </button>
            <button
              onClick={() => setActiveTab("fieldArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fieldArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              畑面積
            </button>
            <button
              onClick={() => setActiveTab("residentialLandArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "residentialLandArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              宅地面積
            </button>
            <button
              onClick={() => setActiveTab("totalAssessedLandRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAssessedLandRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総地積割合
            </button>
            <button
              onClick={() => setActiveTab("paddyFieldRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "paddyFieldRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              田割合
            </button>
            <button
              onClick={() => setActiveTab("fieldRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fieldRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              畑割合
            </button>
            <button
              onClick={() => setActiveTab("residentialLandRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "residentialLandRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              宅地割合
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
          colorScheme: subcategory.colorScheme || "interpolateGreens",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
