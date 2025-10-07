"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface MarriageRankingProps {
  subcategory: SubcategoryData;
}

type RankingType =
  | "marriages"
  | "divorces"
  | "marriageRate"
  | "divorceRate"
  | "avgMarriageAgeHusband"
  | "avgMarriageAgeWife";

export const MarriageRanking: React.FC<MarriageRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingType>("marriages");

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const rateStatsDataId = "0000010201";
  const cdCat01 = {
    marriages: "A9101", // 婚姻件数
    divorces: "A9201", // 離婚件数
    marriageRate: "#A06601", // 婚姻率
    divorceRate: "#A06602", // 離婚率
    avgMarriageAgeHusband: "A9111", // 平均初婚年齢（夫）
    avgMarriageAgeWife: "A9112", // 平均初婚年齢（妻）
  };

  const tabs = [
    {
      id: "marriages" as RankingType,
      label: "婚姻件数",
      statsDataId: statsDataId,
      cdCat01: cdCat01.marriages,
    },
    {
      id: "divorces" as RankingType,
      label: "離婚件数",
      statsDataId: statsDataId,
      cdCat01: cdCat01.divorces,
    },
    {
      id: "marriageRate" as RankingType,
      label: "婚姻率",
      statsDataId: rateStatsDataId,
      cdCat01: cdCat01.marriageRate,
    },
    {
      id: "divorceRate" as RankingType,
      label: "離婚率",
      statsDataId: rateStatsDataId,
      cdCat01: cdCat01.divorceRate,
    },
    {
      id: "avgMarriageAgeHusband" as RankingType,
      label: "平均初婚年齢（夫）",
      statsDataId: statsDataId,
      cdCat01: cdCat01.avgMarriageAgeHusband,
    },
    {
      id: "avgMarriageAgeWife" as RankingType,
      label: "平均初婚年齢（妻）",
      statsDataId: statsDataId,
      cdCat01: cdCat01.avgMarriageAgeWife,
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
          subcategory={{
            ...subcategory,
            unit:
              activeTab === "marriages" || activeTab === "divorces"
                ? "組"
                : activeTab === "avgMarriageAgeHusband" ||
                  activeTab === "avgMarriageAgeWife"
                ? "歳"
                : "人口千人当たり",
            name:
              activeTab === "marriages"
                ? "婚姻件数"
                : activeTab === "divorces"
                ? "離婚件数"
                : activeTab === "marriageRate"
                ? "婚姻率"
                : activeTab === "divorceRate"
                ? "離婚率"
                : activeTab === "avgMarriageAgeHusband"
                ? "平均初婚年齢（夫）"
                : "平均初婚年齢（妻）",
          }}
          options={{
            colorScheme: subcategory.colorScheme || "interpolatePurples",
            divergingMidpoint: "zero",
          }}
          mapWidth={800}
          mapHeight={600}
        />
      )}

      {/* 注釈 */}
      {activeTab === "marriageRate" && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <span className="font-medium">注釈:</span>{" "}
            婚姻率は人口千人当たりの婚姻数を表します。
          </p>
        </div>
      )}
      {activeTab === "divorceRate" && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <span className="font-medium">注釈:</span>{" "}
            離婚率は人口千人当たりの離婚数を表します。
          </p>
        </div>
      )}
      {activeTab === "avgMarriageAgeHusband" && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">注釈:</span>{" "}
            平均初婚年齢（夫）は夫の初婚時の平均年齢を表します。
          </p>
        </div>
      )}
      {activeTab === "avgMarriageAgeWife" && (
        <div className="mt-4 p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg">
          <p className="text-sm text-pink-800 dark:text-pink-200">
            <span className="font-medium">注釈:</span>{" "}
            平均初婚年齢（妻）は妻の初婚時の平均年齢を表します。
          </p>
        </div>
      )}
    </div>
  );
};
