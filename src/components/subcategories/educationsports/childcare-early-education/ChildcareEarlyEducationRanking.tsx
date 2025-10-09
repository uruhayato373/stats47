"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface ChildcareEarlyEducationRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "nurseryCount"
  | "certifiedChildcareCount"
  | "nurseryPerCapita"
  | "certifiedChildcarePerCapita"
  | "publicNurseryRatio";

export const ChildcareEarlyEducationRanking: React.FC<
  ChildcareEarlyEducationRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("nurseryCount");

  const rankings = {
    nurseryCount: {
      statsDataId: "0000010105",
      cdCat01: "E5101",
      unit: "所",
      name: "保育所等数",
    },
    certifiedChildcareCount: {
      statsDataId: "0000010105",
      cdCat01: "E5201",
      unit: "園",
      name: "認定こども園数",
    },
    nurseryPerCapita: {
      statsDataId: "0000010205",
      cdCat01: "#E0110105",
      unit: "所",
      name: "保育所等数（0～5歳人口10万人当たり）",
    },
    certifiedChildcarePerCapita: {
      statsDataId: "0000010205",
      cdCat01: "#E0110106",
      unit: "園",
      name: "認定こども園数（0～5歳人口10万人当たり）",
    },
    publicNurseryRatio: {
      statsDataId: "0000010205",
      cdCat01: "#E01305",
      unit: "％",
      name: "公営保育所等割合",
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
              onClick={() => setActiveTab("nurseryCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nurseryCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保育所等数
            </button>
            <button
              onClick={() => setActiveTab("certifiedChildcareCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "certifiedChildcareCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              認定こども園数
            </button>
            <button
              onClick={() => setActiveTab("nurseryPerCapita")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nurseryPerCapita"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保育所等（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("certifiedChildcarePerCapita")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "certifiedChildcarePerCapita"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              認定こども園（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("publicNurseryRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicNurseryRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              公営割合
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
