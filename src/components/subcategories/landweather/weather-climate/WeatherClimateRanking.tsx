"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface WeatherClimateRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "avgTemperature"
  | "maxTemperature"
  | "minTemperature"
  | "humidity"
  | "clearDays"
  | "precipitationDays"
  | "snowDays"
  | "sunshineDuration"
  | "precipitation";

export const WeatherClimateRanking: React.FC<WeatherClimateRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("avgTemperature");

  const rankings = {
    avgTemperature: {
      statsDataId: "0000010202",
      cdCat01: "#B02101",
      unit: "℃",
      name: "年平均気温",
    },
    maxTemperature: {
      statsDataId: "0000010202",
      cdCat01: "#B02102",
      unit: "℃",
      name: "最高気温（日最高気温の月平均の最高値）",
    },
    minTemperature: {
      statsDataId: "0000010202",
      cdCat01: "#B02103",
      unit: "℃",
      name: "最低気温（日最低気温の月平均の最低値）",
    },
    humidity: {
      statsDataId: "0000010202",
      cdCat01: "#B02201",
      unit: "%",
      name: "年平均相対湿度",
    },
    clearDays: {
      statsDataId: "0000010202",
      cdCat01: "#B02301",
      unit: "日",
      name: "快晴日数（年間）",
    },
    precipitationDays: {
      statsDataId: "0000010202",
      cdCat01: "#B02303",
      unit: "日",
      name: "降水日数（年間）",
    },
    snowDays: {
      statsDataId: "0000010202",
      cdCat01: "#B02304",
      unit: "日",
      name: "雪日数（年間）",
    },
    sunshineDuration: {
      statsDataId: "0000010202",
      cdCat01: "#B02401",
      unit: "時間",
      name: "日照時間（年間）",
    },
    precipitation: {
      statsDataId: "0000010202",
      cdCat01: "#B02402",
      unit: "mm",
      name: "降水量（年間）",
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
              onClick={() => setActiveTab("avgTemperature")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "avgTemperature"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均気温
            </button>
            <button
              onClick={() => setActiveTab("maxTemperature")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "maxTemperature"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              最高気温
            </button>
            <button
              onClick={() => setActiveTab("minTemperature")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "minTemperature"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              最低気温
            </button>
            <button
              onClick={() => setActiveTab("humidity")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "humidity"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              湿度
            </button>
            <button
              onClick={() => setActiveTab("clearDays")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "clearDays"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              快晴日数
            </button>
            <button
              onClick={() => setActiveTab("precipitationDays")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "precipitationDays"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              降水日数
            </button>
            <button
              onClick={() => setActiveTab("snowDays")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "snowDays"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              雪日数
            </button>
            <button
              onClick={() => setActiveTab("sunshineDuration")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sunshineDuration"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              日照時間
            </button>
            <button
              onClick={() => setActiveTab("precipitation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "precipitation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              降水量
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
          colorScheme: subcategory.colorScheme || "interpolateRdYlBu",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
