"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface BirthDeathRankingProps {
  subcategory: SubcategoryData;
}

type RankingType =
  | "naturalIncreaseRate"
  | "birthRate"
  | "totalFertilityRate"
  | "deathRate"
  | "ageAdjustedDeathRateMale"
  | "ageAdjustedDeathRateFemale";

export const BirthDeathRanking: React.FC<BirthDeathRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingType>(
    "naturalIncreaseRate"
  );

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const birthRateStatsDataId = "0000010201";
  const cdCat01 = {
    naturalIncreaseRate: "A4401", // 自然増減率
    birthRate: "#A05202", // 粗出生率
    totalFertilityRate: "#A05203", // 合計特殊出生率
    deathRate: "#A05204", // 粗死亡率
    ageAdjustedDeathRateMale: "#A0521911", // 年齢調整死亡率（男）
    ageAdjustedDeathRateFemale: "#A0521912", // 年齢調整死亡率（女）
  };

  const tabs = [
    {
      id: "naturalIncreaseRate" as RankingType,
      label: "自然増減率",
      statsDataId: statsDataId,
      cdCat01: cdCat01.naturalIncreaseRate,
    },
    {
      id: "birthRate" as RankingType,
      label: "粗出生率",
      statsDataId: birthRateStatsDataId,
      cdCat01: cdCat01.birthRate,
    },
    {
      id: "totalFertilityRate" as RankingType,
      label: "合計特殊出生率",
      statsDataId: birthRateStatsDataId,
      cdCat01: cdCat01.totalFertilityRate,
    },
    {
      id: "deathRate" as RankingType,
      label: "粗死亡率",
      statsDataId: birthRateStatsDataId,
      cdCat01: cdCat01.deathRate,
    },
    {
      id: "ageAdjustedDeathRateMale" as RankingType,
      label: "年齢調整死亡率（男）",
      statsDataId: birthRateStatsDataId,
      cdCat01: cdCat01.ageAdjustedDeathRateMale,
    },
    {
      id: "ageAdjustedDeathRateFemale" as RankingType,
      label: "年齢調整死亡率（女）",
      statsDataId: birthRateStatsDataId,
      cdCat01: cdCat01.ageAdjustedDeathRateFemale,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ランキング
      </h2>

      {/* タブ */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-neutral-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ランキング表示 */}
      {activeTabData && (
        <EstatRanking
          params={{
            statsDataId: activeTabData.statsDataId,
            cdCat01: activeTabData.cdCat01,
          }}
          subcategory={subcategory}
          options={{
            colorScheme: subcategory.colorScheme || "interpolateRdYlGn",
            divergingMidpoint: "zero",
          }}
          mapWidth={800}
          mapHeight={600}
        />
      )}

      {/* 注釈 */}
      {activeTab === "birthRate" && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">注釈:</span>{" "}
            粗出生率は人口1000人あたりの出生数を表します。
          </p>
        </div>
      )}
      {activeTab === "totalFertilityRate" && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <span className="font-medium">注釈:</span>{" "}
            合計特殊出生率は1人の女性が生涯に産むと見込まれる子供の数を表します。
          </p>
        </div>
      )}
      {activeTab === "deathRate" && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            <span className="font-medium">注釈:</span>{" "}
            粗死亡率は人口1,000人あたりの死亡数を表します。
          </p>
        </div>
      )}
      {activeTab === "ageAdjustedDeathRateMale" && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            <span className="font-medium">注釈:</span>{" "}
            年齢調整死亡率（男）は年齢構成の違いを調整した男性の死亡率を表します。
          </p>
        </div>
      )}
      {activeTab === "ageAdjustedDeathRateFemale" && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <span className="font-medium">注釈:</span>{" "}
            年齢調整死亡率（女）は年齢構成の違いを調整した女性の死亡率を表します。
          </p>
        </div>
      )}
    </div>
  );
};
