"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface HousingStatisticsRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "totalHousingUnits"
  | "occupiedHousingUnits"
  | "vacantHousingUnits"
  | "temporaryResidentsOnly"
  | "vacantHouses"
  | "underConstructionHousing"
  | "exclusiveResidentialUnits"
  | "mixedUseHousingUnits"
  | "ownerOccupiedHousing"
  | "rentalHousingUnits"
  | "publicRentalHousing"
  | "publicHousingUnits"
  | "urPublicCorporationHousing"
  | "privateRentalHousing"
  | "companyHousingUnits"
  | "detachedHouses"
  | "detachedWoodenHouses"
  | "detachedNonWoodenHouses"
  | "rowHouses";

export const HousingStatisticsRanking: React.FC<
  HousingStatisticsRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalHousingUnits");

  const rankings = {
    totalHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1100",
      unit: "戸",
      name: "総住宅数",
    },
    occupiedHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1101",
      unit: "戸",
      name: "居住世帯あり住宅数",
    },
    vacantHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1102",
      unit: "戸",
      name: "居住世帯なし住宅数",
    },
    temporaryResidentsOnly: {
      statsDataId: "0000010108",
      cdCat01: "H110201",
      unit: "戸",
      name: "一時現在者のみ住宅数",
    },
    vacantHouses: {
      statsDataId: "0000010108",
      cdCat01: "H110202",
      unit: "戸",
      name: "空き家数",
    },
    underConstructionHousing: {
      statsDataId: "0000010108",
      cdCat01: "H110203",
      unit: "戸",
      name: "建築中住宅数",
    },
    exclusiveResidentialUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1201",
      unit: "戸",
      name: "専用住宅数",
    },
    mixedUseHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1203",
      unit: "戸",
      name: "店舗その他の併用住宅数",
    },
    ownerOccupiedHousing: {
      statsDataId: "0000010108",
      cdCat01: "H1310",
      unit: "戸",
      name: "持ち家数",
    },
    rentalHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1320",
      unit: "戸",
      name: "借家数",
    },
    publicRentalHousing: {
      statsDataId: "0000010108",
      cdCat01: "H1321",
      unit: "戸",
      name: "公営・都市再生機構（ＵＲ）・公社の借家数",
    },
    publicHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H132101",
      unit: "戸",
      name: "公営の借家数",
    },
    urPublicCorporationHousing: {
      statsDataId: "0000010108",
      cdCat01: "H132102",
      unit: "戸",
      name: "都市再生機構（ＵＲ）・公社の借家数",
    },
    privateRentalHousing: {
      statsDataId: "0000010108",
      cdCat01: "H1322",
      unit: "戸",
      name: "民営借家数",
    },
    companyHousingUnits: {
      statsDataId: "0000010108",
      cdCat01: "H1323",
      unit: "戸",
      name: "給与住宅数",
    },
    detachedHouses: {
      statsDataId: "0000010108",
      cdCat01: "H1401",
      unit: "戸",
      name: "一戸建住宅数",
    },
    detachedWoodenHouses: {
      statsDataId: "0000010108",
      cdCat01: "H140101",
      unit: "戸",
      name: "一戸建住宅数（木造）",
    },
    detachedNonWoodenHouses: {
      statsDataId: "0000010108",
      cdCat01: "H140102",
      unit: "戸",
      name: "一戸建住宅数（非木造）",
    },
    rowHouses: {
      statsDataId: "0000010108",
      cdCat01: "H1402",
      unit: "戸",
      name: "長屋建住宅数",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("totalHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総住宅数
            </button>
            <button
              onClick={() => setActiveTab("occupiedHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "occupiedHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              居住世帯あり住宅数
            </button>
            <button
              onClick={() => setActiveTab("vacantHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "vacantHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              居住世帯なし住宅数
            </button>
            <button
              onClick={() => setActiveTab("vacantHouses")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "vacantHouses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              空き家数
            </button>
            <button
              onClick={() => setActiveTab("underConstructionHousing")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "underConstructionHousing"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              建築中住宅数
            </button>
            <button
              onClick={() => setActiveTab("exclusiveResidentialUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "exclusiveResidentialUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              専用住宅数
            </button>
            <button
              onClick={() => setActiveTab("mixedUseHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mixedUseHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              併用住宅数
            </button>
            <button
              onClick={() => setActiveTab("ownerOccupiedHousing")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "ownerOccupiedHousing"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              持ち家数
            </button>
            <button
              onClick={() => setActiveTab("rentalHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rentalHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              借家数
            </button>
            <button
              onClick={() => setActiveTab("publicHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              公営借家数
            </button>
            <button
              onClick={() => setActiveTab("privateRentalHousing")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "privateRentalHousing"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              民営借家数
            </button>
            <button
              onClick={() => setActiveTab("companyHousingUnits")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "companyHousingUnits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              給与住宅数
            </button>
            <button
              onClick={() => setActiveTab("detachedHouses")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "detachedHouses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              一戸建住宅数
            </button>
            <button
              onClick={() => setActiveTab("detachedWoodenHouses")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "detachedWoodenHouses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              一戸建住宅数（木造）
            </button>
            <button
              onClick={() => setActiveTab("detachedNonWoodenHouses")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "detachedNonWoodenHouses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              一戸建住宅数（非木造）
            </button>
            <button
              onClick={() => setActiveTab("rowHouses")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rowHouses"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              長屋建住宅数
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
