"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

type RankingTab =
  | "agriculturalLand"
  | "forestLand"
  | "residentialLand"
  | "commercialLand"
  | "industrialLand"
  | "agriculturalLandRatio"
  | "forestLandRatio"
  | "residentialLandRatio";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

interface LandUseRankingClientProps {
  rankings: Record<RankingTab, RankingData>;
  subcategory: SubcategoryData;
}

export const LandUseRankingClient: React.FC<LandUseRankingClientProps> = ({
  rankings,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("agriculturalLand");
  const activeRanking = rankings[activeTab];

  const tabOptions = [
    { key: "agriculturalLand" as RankingTab, label: "農用地" },
    { key: "forestLand" as RankingTab, label: "森林" },
    { key: "residentialLand" as RankingTab, label: "宅地" },
    { key: "commercialLand" as RankingTab, label: "商業地" },
    { key: "industrialLand" as RankingTab, label: "工業地" },
    { key: "agriculturalLandRatio" as RankingTab, label: "農用地割合" },
    { key: "forestLandRatio" as RankingTab, label: "森林割合" },
    { key: "residentialLandRatio" as RankingTab, label: "宅地割合" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
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
      </div>

      {/* 右側のリスト */}
      <div className="lg:w-60 flex-shrink-0">
        <div className="lg:border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              統計項目
            </h3>
            <nav className="space-y-2" aria-label="統計項目">
              {tabOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setActiveTab(option.key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === option.key
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
