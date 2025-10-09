"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface CommutingEmploymentRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "inPrefectureEmployedRatio"
  | "migrantWorkerRatio"
  | "commuterToOtherMunicipalitiesRatio"
  | "commuterFromOtherMunicipalitiesRatio"
  | "employmentRate"
  | "employedOutsidePrefectureRatio";

export const CommutingEmploymentRanking: React.FC<
  CommutingEmploymentRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "inPrefectureEmployedRatio"
  );

  const rankings = {
    inPrefectureEmployedRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F02501",
      unit: "％",
      name: "県内就業者比率",
    },
    migrantWorkerRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F0260101",
      unit: "％",
      name: "出稼者比率（販売農家）",
    },
    commuterToOtherMunicipalitiesRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F02701",
      unit: "％",
      name: "他市区町村への通勤者比率",
    },
    commuterFromOtherMunicipalitiesRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F02702",
      unit: "％",
      name: "他市区町村からの通勤者比率",
    },
    employmentRate: {
      statsDataId: "0000010206",
      cdCat01: "#F03101",
      unit: "％",
      name: "就職率",
    },
    employedOutsidePrefectureRatio: {
      statsDataId: "0000010206",
      cdCat01: "#F0310201",
      unit: "％",
      name: "県外就職者比率",
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
              onClick={() => setActiveTab("inPrefectureEmployedRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "inPrefectureEmployedRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              県内就業者比率
            </button>
            <button
              onClick={() => setActiveTab("migrantWorkerRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "migrantWorkerRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              出稼者比率
            </button>
            <button
              onClick={() => setActiveTab("commuterToOtherMunicipalitiesRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commuterToOtherMunicipalitiesRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              他市区町村への通勤
            </button>
            <button
              onClick={() =>
                setActiveTab("commuterFromOtherMunicipalitiesRatio")
              }
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commuterFromOtherMunicipalitiesRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              他市区町村からの通勤
            </button>
            <button
              onClick={() => setActiveTab("employmentRate")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employmentRate"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              就職率
            </button>
            <button
              onClick={() => setActiveTab("employedOutsidePrefectureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employedOutsidePrefectureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              県外就職者比率
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
