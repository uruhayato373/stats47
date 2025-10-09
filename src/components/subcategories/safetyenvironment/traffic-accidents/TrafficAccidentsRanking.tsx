"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface TrafficAccidentsRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "accidentCountPerPopulation"
  | "accidentCountPerRoadLength"
  | "casualtiesPerPopulation"
  | "deathsPerPopulation"
  | "injuriesPerPopulation"
  | "casualtiesPer100Accidents"
  | "deathsPer100Accidents"
  | "violationArrestCountPerPopulation"
  | "totalAccidentCount"
  | "totalCasualties"
  | "totalDeaths"
  | "totalInjuries"
  | "infantCasualties"
  | "elementaryCasualties"
  | "elderlyCasualties"
  | "trafficViolationArrestCount"
  | "trafficAccidentJuvenileCount"
  | "trafficAccidentPersonCount";

export const TrafficAccidentsRanking: React.FC<
  TrafficAccidentsRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "accidentCountPerPopulation"
  );

  const rankings = {
    accidentCountPerPopulation: {
      statsDataId: "0000010211",
      cdCat01: "#K04101",
      unit: "件",
      name: "交通事故発生件数（人口10万人当たり）",
    },
    accidentCountPerRoadLength: {
      statsDataId: "0000010211",
      cdCat01: "#K04102",
      unit: "件",
      name: "交通事故発生件数（道路実延長千km当たり）",
    },
    casualtiesPerPopulation: {
      statsDataId: "0000010211",
      cdCat01: "#K04105",
      unit: "人",
      name: "交通事故死傷者数（人口10万人当たり）",
    },
    deathsPerPopulation: {
      statsDataId: "0000010211",
      cdCat01: "#K04106",
      unit: "人",
      name: "交通事故死者数（人口10万人当たり）",
    },
    injuriesPerPopulation: {
      statsDataId: "0000010211",
      cdCat01: "#K04107",
      unit: "人",
      name: "交通事故負傷者数（人口10万人当たり）",
    },
    casualtiesPer100Accidents: {
      statsDataId: "0000010211",
      cdCat01: "#K04201",
      unit: "人",
      name: "交通事故死傷者数（交通事故100件当たり）",
    },
    deathsPer100Accidents: {
      statsDataId: "0000010211",
      cdCat01: "#K04202",
      unit: "人",
      name: "交通事故死者数（交通事故100件当たり）",
    },
    violationArrestCountPerPopulation: {
      statsDataId: "0000010211",
      cdCat01: "#K04301",
      unit: "件",
      name: "道路交通法違反検挙件数（人口千人当たり）",
    },
    totalAccidentCount: {
      statsDataId: "0000010111",
      cdCat01: "K3101",
      unit: "件",
      name: "交通事故発生件数",
    },
    totalCasualties: {
      statsDataId: "0000010111",
      cdCat01: "K3102",
      unit: "人",
      name: "交通事故死傷者数",
    },
    totalDeaths: {
      statsDataId: "0000010111",
      cdCat01: "K3103",
      unit: "人",
      name: "交通事故死者数",
    },
    totalInjuries: {
      statsDataId: "0000010111",
      cdCat01: "K3104",
      unit: "人",
      name: "交通事故負傷者数",
    },
    infantCasualties: {
      statsDataId: "0000010111",
      cdCat01: "K310201",
      unit: "人",
      name: "交通事故死傷者数（乳幼児：0～6歳）",
    },
    elementaryCasualties: {
      statsDataId: "0000010111",
      cdCat01: "K310202",
      unit: "人",
      name: "交通事故死傷者数（小学生：7～12歳）",
    },
    elderlyCasualties: {
      statsDataId: "0000010111",
      cdCat01: "K310203",
      unit: "人",
      name: "交通事故死傷者数（高齢者：65歳以上）",
    },
    trafficViolationArrestCount: {
      statsDataId: "0000010111",
      cdCat01: "K4401",
      unit: "件",
      name: "道路交通法違反検挙総件数（告知・送致）",
    },
    trafficAccidentJuvenileCount: {
      statsDataId: "0000010111",
      cdCat01: "K4403",
      unit: "件",
      name: "交通事故事件少年件数",
    },
    trafficAccidentPersonCount: {
      statsDataId: "0000010111",
      cdCat01: "K4404",
      unit: "人",
      name: "交通事故事件人員",
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
              onClick={() => setActiveTab("accidentCountPerPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "accidentCountPerPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              発生件数（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("accidentCountPerRoadLength")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "accidentCountPerRoadLength"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              発生件数（道路当たり）
            </button>
            <button
              onClick={() => setActiveTab("casualtiesPerPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "casualtiesPerPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              死傷者数（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("deathsPerPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "deathsPerPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              死者数（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("injuriesPerPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "injuriesPerPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              負傷者数（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("casualtiesPer100Accidents")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "casualtiesPer100Accidents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              死傷者数（100件当たり）
            </button>
            <button
              onClick={() => setActiveTab("deathsPer100Accidents")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "deathsPer100Accidents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              死者数（100件当たり）
            </button>
            <button
              onClick={() => setActiveTab("violationArrestCountPerPopulation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "violationArrestCountPerPopulation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              違反検挙件数（人口当たり）
            </button>
            <button
              onClick={() => setActiveTab("totalAccidentCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalAccidentCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総発生件数
            </button>
            <button
              onClick={() => setActiveTab("totalCasualties")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalCasualties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総死傷者数
            </button>
            <button
              onClick={() => setActiveTab("totalDeaths")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalDeaths"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総死者数
            </button>
            <button
              onClick={() => setActiveTab("totalInjuries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "totalInjuries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総負傷者数
            </button>
            <button
              onClick={() => setActiveTab("infantCasualties")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "infantCasualties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              乳幼児死傷者数
            </button>
            <button
              onClick={() => setActiveTab("elementaryCasualties")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "elementaryCasualties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              小学生死傷者数
            </button>
            <button
              onClick={() => setActiveTab("elderlyCasualties")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "elderlyCasualties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              高齢者死傷者数
            </button>
            <button
              onClick={() => setActiveTab("trafficViolationArrestCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trafficViolationArrestCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              交通違反検挙件数
            </button>
            <button
              onClick={() => setActiveTab("trafficAccidentJuvenileCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trafficAccidentJuvenileCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              少年事件件数
            </button>
            <button
              onClick={() => setActiveTab("trafficAccidentPersonCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trafficAccidentPersonCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              事件人員数
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
          colorScheme: subcategory.colorScheme || "interpolateReds",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
