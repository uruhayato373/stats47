"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface RoadsRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "totalRoadLength"
  | "roadLengthIncludingExpressways"
  | "majorRoadLength"
  | "nationalHighwayLength"
  | "majorLocalRoadLength"
  | "prefecturalRoadLength"
  | "municipalRoadLength"
  | "expresswayLength"
  | "pavedRoadLength"
  | "pavedMajorRoadLength"
  | "pavedNationalHighwayLength"
  | "pavedMajorLocalRoadLength"
  | "pavedPrefecturalRoadLength"
  | "pavedMunicipalRoadLength"
  | "roadLengthPerKm2"
  | "mainRoadLengthPerKm2"
  | "vehicleKilometersTraveled"
  | "averageTrafficVolume"
  | "lightVehiclesNumber"
  | "motorizedBicyclesNumber"
  | "commutersOutsideHome"
  | "localCommuters"
  | "intraPrefectureCommuters"
  | "interPrefectureCommuters";

export const RoadsRanking: React.FC<RoadsRankingProps> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("totalRoadLength");

  const rankings = {
    totalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7110",
      unit: "km",
      name: "道路実延長",
    },
    roadLengthIncludingExpressways: {
      statsDataId: "0000010108",
      cdCat01: "H711001",
      unit: "km",
      name: "道路実延長（高速道路を含む）",
    },
    majorRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7111",
      unit: "km",
      name: "道路実延長（主要道路）",
    },
    nationalHighwayLength: {
      statsDataId: "0000010108",
      cdCat01: "H711101",
      unit: "km",
      name: "道路実延長（一般国道）",
    },
    majorLocalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H711102",
      unit: "km",
      name: "道路実延長（主要地方道）",
    },
    prefecturalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H711103",
      unit: "km",
      name: "道路実延長（一般都道府県道）",
    },
    municipalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7112",
      unit: "km",
      name: "道路実延長（市町村道）",
    },
    expresswayLength: {
      statsDataId: "0000010108",
      cdCat01: "H7113",
      unit: "km",
      name: "道路実延長（高速道路）",
    },
    pavedRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7120",
      unit: "km",
      name: "舗装道路実延長",
    },
    pavedMajorRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7121",
      unit: "km",
      name: "舗装道路実延長（主要道路）",
    },
    pavedNationalHighwayLength: {
      statsDataId: "0000010108",
      cdCat01: "H712101",
      unit: "km",
      name: "舗装道路実延長（一般国道）",
    },
    pavedMajorLocalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H712102",
      unit: "km",
      name: "舗装道路実延長（主要地方道）",
    },
    pavedPrefecturalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H712103",
      unit: "km",
      name: "舗装道路実延長（一般都道府県道）",
    },
    pavedMunicipalRoadLength: {
      statsDataId: "0000010108",
      cdCat01: "H7122",
      unit: "km",
      name: "舗装道路実延長（市町村道）",
    },
    roadLengthPerKm2: {
      statsDataId: "0000010208",
      cdCat01: "#H06401",
      unit: "km/km²",
      name: "道路実延長（総面積1km²当たり）",
    },
    mainRoadLengthPerKm2: {
      statsDataId: "0000010208",
      cdCat01: "#H06402",
      unit: "km/km²",
      name: "主要道路実延長（総面積1km²当たり）",
    },
    vehicleKilometersTraveled: {
      statsDataId: "0000010108",
      cdCat01: "H7150",
      unit: "千台・km/12h",
      name: "自動車走行台キロ",
    },
    averageTrafficVolume: {
      statsDataId: "0000010108",
      cdCat01: "H7160",
      unit: "台/12h",
      name: "道路平均交通量",
    },
    lightVehiclesNumber: {
      statsDataId: "0000010108",
      cdCat01: "H7207",
      unit: "台",
      name: "軽自動車等台数",
    },
    motorizedBicyclesNumber: {
      statsDataId: "0000010108",
      cdCat01: "H7209",
      unit: "台",
      name: "原動機付自転車台数",
    },
    commutersOutsideHome: {
      statsDataId: "0000010108",
      cdCat01: "H7301",
      unit: "人",
      name: "自宅外通勤・通学者数",
    },
    localCommuters: {
      statsDataId: "0000010108",
      cdCat01: "H7302",
      unit: "人",
      name: "自市区町村内通勤・通学者数",
    },
    intraPrefectureCommuters: {
      statsDataId: "0000010108",
      cdCat01: "H7303",
      unit: "人",
      name: "県内他市区町村への通勤・通学者数",
    },
    interPrefectureCommuters: {
      statsDataId: "0000010108",
      cdCat01: "H7304",
      unit: "人",
      name: "他県への通勤・通学者数",
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
              onClick={() => setActiveTab("totalRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総道路延長
            </button>
            <button
              onClick={() => setActiveTab("roadLengthIncludingExpressways")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "roadLengthIncludingExpressways"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              道路延長（高速含む）
            </button>
            <button
              onClick={() => setActiveTab("majorRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "majorRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              主要道路延長
            </button>
            <button
              onClick={() => setActiveTab("nationalHighwayLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nationalHighwayLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              一般国道延長
            </button>
            <button
              onClick={() => setActiveTab("majorLocalRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "majorLocalRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              主要地方道延長
            </button>
            <button
              onClick={() => setActiveTab("prefecturalRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "prefecturalRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              都道府県道延長
            </button>
            <button
              onClick={() => setActiveTab("municipalRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "municipalRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              市町村道延長
            </button>
            <button
              onClick={() => setActiveTab("expresswayLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "expresswayLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              高速道路延長
            </button>
            <button
              onClick={() => setActiveTab("pavedRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pavedRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              舗装道路延長
            </button>
            <button
              onClick={() => setActiveTab("roadLengthPerKm2")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "roadLengthPerKm2"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              道路密度
            </button>
            <button
              onClick={() => setActiveTab("mainRoadLengthPerKm2")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mainRoadLengthPerKm2"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              主要道路密度
            </button>
            <button
              onClick={() => setActiveTab("vehicleKilometersTraveled")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "vehicleKilometersTraveled"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              走行台キロ
            </button>
            <button
              onClick={() => setActiveTab("averageTrafficVolume")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "averageTrafficVolume"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均交通量
            </button>
            <button
              onClick={() => setActiveTab("lightVehiclesNumber")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lightVehiclesNumber"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              軽自動車台数
            </button>
            <button
              onClick={() => setActiveTab("motorizedBicyclesNumber")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "motorizedBicyclesNumber"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              原付台数
            </button>
            <button
              onClick={() => setActiveTab("commutersOutsideHome")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "commutersOutsideHome"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              自宅外通勤者
            </button>
            <button
              onClick={() => setActiveTab("localCommuters")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "localCommuters"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              市内通勤者
            </button>
            <button
              onClick={() => setActiveTab("intraPrefectureCommuters")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "intraPrefectureCommuters"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              県内通勤者
            </button>
            <button
              onClick={() => setActiveTab("interPrefectureCommuters")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "interPrefectureCommuters"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              県外通勤者
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
          colorScheme: subcategory.colorScheme || "interpolateBlues",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
