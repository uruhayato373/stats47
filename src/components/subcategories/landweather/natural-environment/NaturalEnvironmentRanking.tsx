"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryRankingPageProps } from "@/types/subcategory";

type RankingTab =
  | "nationalParks"
  | "quasiNationalParks"
  | "prefecturalParks"
  | "naturalMonuments"
  | "nationalParksArea"
  | "quasiNationalParksArea"
  | "prefecturalParksArea";

export const NaturalEnvironmentRanking: React.FC<
  SubcategoryRankingPageProps
> = ({ category, subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("nationalParks");

  const rankings = {
    nationalParks: {
      statsDataId: "0000010201",
      cdCat01: "#A01301",
      unit: "箇所",
      name: "国立公園",
    },
    quasiNationalParks: {
      statsDataId: "0000010201",
      cdCat01: "#A01302",
      unit: "箇所",
      name: "国定公園",
    },
    prefecturalParks: {
      statsDataId: "0000010201",
      cdCat01: "#A01303",
      unit: "箇所",
      name: "都道府県立自然公園",
    },
    naturalMonuments: {
      statsDataId: "0000010201",
      cdCat01: "#A01304",
      unit: "箇所",
      name: "天然記念物",
    },
    nationalParksArea: {
      statsDataId: "0000010201",
      cdCat01: "#A01305",
      unit: "ha",
      name: "国立公園面積",
    },
    quasiNationalParksArea: {
      statsDataId: "0000010201",
      cdCat01: "#A01306",
      unit: "ha",
      name: "国定公園面積",
    },
    prefecturalParksArea: {
      statsDataId: "0000010201",
      cdCat01: "#A01307",
      unit: "ha",
      name: "都道府県立自然公園面積",
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
              onClick={() => setActiveTab("nationalParks")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nationalParks"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              国立公園
            </button>
            <button
              onClick={() => setActiveTab("quasiNationalParks")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "quasiNationalParks"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              国定公園
            </button>
            <button
              onClick={() => setActiveTab("prefecturalParks")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "prefecturalParks"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              都道府県立自然公園
            </button>
            <button
              onClick={() => setActiveTab("naturalMonuments")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "naturalMonuments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              天然記念物
            </button>
            <button
              onClick={() => setActiveTab("nationalParksArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nationalParksArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              国立公園面積
            </button>
            <button
              onClick={() => setActiveTab("quasiNationalParksArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "quasiNationalParksArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              国定公園面積
            </button>
            <button
              onClick={() => setActiveTab("prefecturalParksArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "prefecturalParksArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              都道府県立自然公園面積
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
