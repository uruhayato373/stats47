"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface HealthCareRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "tuberculosisCheckup"
  | "lifestyleDiseaseCheckup"
  | "publicHealthCenterCheckup"
  | "mentalHealthCheckup"
  | "publicHealthCenterLifestyleDiseaseCheckup"
  | "maternalHealthCheckup"
  | "infantHealthCheckup"
  | "lifeExpectancyAtBirthMale"
  | "lifeExpectancyAtBirthFemale"
  | "lifeExpectancyAt20Male"
  | "lifeExpectancyAt20Female"
  | "lifeExpectancyAt40Male"
  | "lifeExpectancyAt40Female"
  | "lifeExpectancyAt60Male"
  | "lifeExpectancyAt60Female"
  | "lifeExpectancyAt65Male"
  | "lifeExpectancyAt65Female"
  | "healthLifeExpectancyMale"
  | "healthLifeExpectancyFemale";

export const HealthCareRanking: React.FC<HealthCareRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("tuberculosisCheckup");

  const rankings = {
    tuberculosisCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210101",
      unit: "人",
      name: "健康診断受診者数（保健所及び市区町村実施分）（結核）",
    },
    lifestyleDiseaseCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210104",
      unit: "人",
      name: "健康診断受診者数（保健所及び市区町村実施分）（生活習慣病）",
    },
    publicHealthCenterCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210110",
      unit: "人",
      name: "健康診断受診者数（保健所実施分）",
    },
    mentalHealthCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210112",
      unit: "人",
      name: "健康診断受診者数（保健所実施分・精神）",
    },
    publicHealthCenterLifestyleDiseaseCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210114",
      unit: "人",
      name: "健康診断受診者数（保健所実施分・生活習慣病）",
    },
    maternalHealthCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210115",
      unit: "人",
      name: "健康診断受診者数（保健所実施分・妊産婦）",
    },
    infantHealthCheckup: {
      statsDataId: "0000010109",
      cdCat01: "I210116",
      unit: "人",
      name: "健康診断受診者数（保健所実施分・乳幼児）",
    },
    lifeExpectancyAtBirthMale: {
      statsDataId: "0000010109",
      cdCat01: "I1101",
      unit: "年",
      name: "平均余命（0歳）（男）",
    },
    lifeExpectancyAtBirthFemale: {
      statsDataId: "0000010109",
      cdCat01: "I1102",
      unit: "年",
      name: "平均余命（0歳）（女）",
    },
    lifeExpectancyAt20Male: {
      statsDataId: "0000010109",
      cdCat01: "I1201",
      unit: "年",
      name: "平均余命（20歳）（男）",
    },
    lifeExpectancyAt20Female: {
      statsDataId: "0000010109",
      cdCat01: "I1202",
      unit: "年",
      name: "平均余命（20歳）（女）",
    },
    lifeExpectancyAt40Male: {
      statsDataId: "0000010109",
      cdCat01: "I1301",
      unit: "年",
      name: "平均余命（40歳）（男）",
    },
    lifeExpectancyAt40Female: {
      statsDataId: "0000010109",
      cdCat01: "I1302",
      unit: "年",
      name: "平均余命（40歳）（女）",
    },
    lifeExpectancyAt60Male: {
      statsDataId: "0000010109",
      cdCat01: "I1401",
      unit: "年",
      name: "平均余命（60歳）（男）",
    },
    lifeExpectancyAt60Female: {
      statsDataId: "0000010109",
      cdCat01: "I1402",
      unit: "年",
      name: "平均余命（60歳）（女）",
    },
    lifeExpectancyAt65Male: {
      statsDataId: "0000010109",
      cdCat01: "I1501",
      unit: "年",
      name: "平均余命（65歳）（男）",
    },
    lifeExpectancyAt65Female: {
      statsDataId: "0000010109",
      cdCat01: "I1502",
      unit: "年",
      name: "平均余命（65歳）（女）",
    },
    healthLifeExpectancyMale: {
      statsDataId: "0000010109",
      cdCat01: "I1601",
      unit: "年",
      name: "健康寿命（男）",
    },
    healthLifeExpectancyFemale: {
      statsDataId: "0000010109",
      cdCat01: "I1602",
      unit: "年",
      name: "健康寿命（女）",
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
              onClick={() => setActiveTab("tuberculosisCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tuberculosisCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              結核健診
            </button>
            <button
              onClick={() => setActiveTab("lifestyleDiseaseCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifestyleDiseaseCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              生活習慣病健診
            </button>
            <button
              onClick={() => setActiveTab("publicHealthCenterCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicHealthCenterCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保健所健診
            </button>
            <button
              onClick={() => setActiveTab("mentalHealthCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mentalHealthCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              精神健診
            </button>
            <button
              onClick={() =>
                setActiveTab("publicHealthCenterLifestyleDiseaseCheckup")
              }
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicHealthCenterLifestyleDiseaseCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保健所生活習慣病健診
            </button>
            <button
              onClick={() => setActiveTab("maternalHealthCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "maternalHealthCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              妊産婦健診
            </button>
            <button
              onClick={() => setActiveTab("infantHealthCheckup")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "infantHealthCheckup"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              乳幼児健診
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAtBirthMale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAtBirthMale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（0歳・男）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAtBirthFemale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAtBirthFemale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（0歳・女）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt20Male")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt20Male"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（20歳・男）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt20Female")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt20Female"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（20歳・女）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt40Male")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt40Male"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（40歳・男）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt40Female")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt40Female"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（40歳・女）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt60Male")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt60Male"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（60歳・男）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt60Female")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt60Female"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（60歳・女）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt65Male")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt65Male"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（65歳・男）
            </button>
            <button
              onClick={() => setActiveTab("lifeExpectancyAt65Female")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "lifeExpectancyAt65Female"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              平均余命（65歳・女）
            </button>
            <button
              onClick={() => setActiveTab("healthLifeExpectancyMale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "healthLifeExpectancyMale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              健康寿命（男）
            </button>
            <button
              onClick={() => setActiveTab("healthLifeExpectancyFemale")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "healthLifeExpectancyFemale"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              健康寿命（女）
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
          colorScheme: subcategory.colorScheme || "interpolateGreens",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
