"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

type RankingTab =
  | "totalAreaExcluding"
  | "totalAreaIncluding"
  | "habitableArea"
  | "majorLakeArea"
  | "totalAreaIncludingRatio"
  | "areaRatio"
  | "habitableAreaRatio";

interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

interface LandAreaRankingClientProps {
  rankings: Record<RankingTab, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: RankingTab;
}

export const LandAreaRankingClient: React.FC<LandAreaRankingClientProps> = ({
  rankings,
  subcategory,
  activeRankingId,
}) => {
  const params = useParams();
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  const activeRanking = rankings[activeRankingId];

  const tabOptions = [
    { key: "totalAreaExcluding" as RankingTab, label: "総面積（除く）" },
    { key: "totalAreaIncluding" as RankingTab, label: "総面積（含む）" },
    { key: "habitableArea" as RankingTab, label: "可住地面積" },
    { key: "majorLakeArea" as RankingTab, label: "主要湖沼面積" },
    { key: "totalAreaIncludingRatio" as RankingTab, label: "総面積（100km²）" },
    { key: "areaRatio" as RankingTab, label: "面積割合" },
    { key: "habitableAreaRatio" as RankingTab, label: "可住地面積割合" },
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
              {tabOptions.map((option) => {
                const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
                const isActive = activeRankingId === option.key;

                return (
                  <Link
                    key={option.key}
                    href={href}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
