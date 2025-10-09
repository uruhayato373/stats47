"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab =
  | "agriculturalLand"
  | "forestLand"
  | "residentialLand"
  | "commercialLand"
  | "industrialLand"
  | "agriculturalLandRatio"
  | "forestLandRatio"
  | "residentialLandRatio";

export const LandUseRanking: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("agriculturalLand");

  const rankings = {
    agriculturalLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01201",
      unit: "ha",
      name: "農用地",
    },
    forestLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01202",
      unit: "ha",
      name: "森林",
    },
    residentialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01203",
      unit: "ha",
      name: "宅地",
    },
    commercialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01204",
      unit: "ha",
      name: "商業地",
    },
    industrialLand: {
      statsDataId: "0000010201",
      cdCat01: "#A01205",
      unit: "ha",
      name: "工業地",
    },
    agriculturalLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01206",
      unit: "%",
      name: "農用地割合",
    },
    forestLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01207",
      unit: "%",
      name: "森林割合",
    },
    residentialLandRatio: {
      statsDataId: "0000010201",
      cdCat01: "#A01208",
      unit: "%",
      name: "宅地割合",
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
          <nav
            className="-mb-px flex space-x-8 overflow-x-auto"
            aria-label="Tabs"
          >
            <button
              onClick={() => setActiveTab("agriculturalLand")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agriculturalLand"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農用地
            </button>
            <button
              onClick={() => setActiveTab("forestLand")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "forestLand"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              森林
            </button>
            <button
              onClick={() => setActiveTab("residentialLand")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "residentialLand"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              宅地
            </button>
            <button
              onClick={() => setActiveTab("commercialLand")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commercialLand"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              商業地
            </button>
            <button
              onClick={() => setActiveTab("industrialLand")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "industrialLand"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              工業地
            </button>
            <button
              onClick={() => setActiveTab("agriculturalLandRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agriculturalLandRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              農用地割合
            </button>
            <button
              onClick={() => setActiveTab("forestLandRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "forestLandRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              森林割合
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
    </SubcategoryLayout>
  );
};
