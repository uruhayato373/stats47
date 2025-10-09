"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface FireEmergencyRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "fireDepartmentCount"
  | "fireDepartmentEmployees"
  | "fireOfficers"
  | "fireBrigadeCount"
  | "fireDivisionCount"
  | "fireMembers"
  | "pumpCars"
  | "waterSources"
  | "dispatchCount"
  | "fireDispatchCount"
  | "disasterDispatchCount"
  | "emergencyCars"
  | "emergencyDispatchCount"
  | "transferDispatchCount"
  | "fireOutbreakCount"
  | "buildingFireCount"
  | "fireDamageArea"
  | "fireDamageAmount"
  | "buildingFireDamageAmount"
  | "fireDamageHouseholds"
  | "fireDamagePersons"
  | "fireCasualties"
  | "fireDeaths"
  | "fireInjuries"
  | "fireInsuranceNewContracts"
  | "fireInsurancePayments";

export const FireEmergencyRanking: React.FC<FireEmergencyRankingProps> = ({
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("fireDepartmentCount");

  const rankings = {
    fireDepartmentCount: {
      statsDataId: "0000010111",
      cdCat01: "K1101",
      unit: "署",
      name: "消防本部・署数",
    },
    fireDepartmentEmployees: {
      statsDataId: "0000010111",
      cdCat01: "K1102",
      unit: "人",
      name: "消防職員数",
    },
    fireOfficers: {
      statsDataId: "0000010111",
      cdCat01: "K1103",
      unit: "人",
      name: "消防吏員数",
    },
    fireBrigadeCount: {
      statsDataId: "0000010111",
      cdCat01: "K110401",
      unit: "団",
      name: "消防団数",
    },
    fireDivisionCount: {
      statsDataId: "0000010111",
      cdCat01: "K110402",
      unit: "団",
      name: "消防分団数",
    },
    fireMembers: {
      statsDataId: "0000010111",
      cdCat01: "K1105",
      unit: "人",
      name: "消防団員数",
    },
    pumpCars: {
      statsDataId: "0000010111",
      cdCat01: "K1106",
      unit: "台",
      name: "消防ポンプ自動車等現有数",
    },
    waterSources: {
      statsDataId: "0000010111",
      cdCat01: "K1107",
      unit: "所",
      name: "消防水利数",
    },
    dispatchCount: {
      statsDataId: "0000010111",
      cdCat01: "K1201",
      unit: "回",
      name: "消防機関出動回数",
    },
    fireDispatchCount: {
      statsDataId: "0000010111",
      cdCat01: "K120201",
      unit: "回",
      name: "消防機関出動回数（火災）",
    },
    disasterDispatchCount: {
      statsDataId: "0000010111",
      cdCat01: "K120202",
      unit: "回",
      name: "消防機関出動回数（風水害）",
    },
    emergencyCars: {
      statsDataId: "0000010111",
      cdCat01: "K1209",
      unit: "台",
      name: "救急自動車数",
    },
    emergencyDispatchCount: {
      statsDataId: "0000010111",
      cdCat01: "K1210",
      unit: "件",
      name: "救急出動件数",
    },
    transferDispatchCount: {
      statsDataId: "0000010111",
      cdCat01: "K1214",
      unit: "件",
      name: "救急出場件数（転院搬送）",
    },
    fireOutbreakCount: {
      statsDataId: "0000010111",
      cdCat01: "K2101",
      unit: "件",
      name: "出火件数",
    },
    buildingFireCount: {
      statsDataId: "0000010111",
      cdCat01: "K2102",
      unit: "件",
      name: "建物火災出火件数",
    },
    fireDamageArea: {
      statsDataId: "0000010111",
      cdCat01: "K210311",
      unit: "m²",
      name: "建物焼損床面積",
    },
    fireDamageAmount: {
      statsDataId: "0000010111",
      cdCat01: "K2105",
      unit: "千円",
      name: "火災損害額",
    },
    buildingFireDamageAmount: {
      statsDataId: "0000010111",
      cdCat01: "K2106",
      unit: "千円",
      name: "建物火災損害額",
    },
    fireDamageHouseholds: {
      statsDataId: "0000010111",
      cdCat01: "K2107",
      unit: "世帯",
      name: "火災り災世帯数",
    },
    fireDamagePersons: {
      statsDataId: "0000010111",
      cdCat01: "K2108",
      unit: "人",
      name: "火災り災人員数",
    },
    fireCasualties: {
      statsDataId: "0000010111",
      cdCat01: "K2109",
      unit: "人",
      name: "火災死傷者数",
    },
    fireDeaths: {
      statsDataId: "0000010111",
      cdCat01: "K2110",
      unit: "人",
      name: "火災死亡者数",
    },
    fireInjuries: {
      statsDataId: "0000010111",
      cdCat01: "K2111",
      unit: "人",
      name: "火災負傷者数",
    },
    fireInsuranceNewContracts: {
      statsDataId: "0000010111",
      cdCat01: "K2201",
      unit: "件",
      name: "火災保険新契約件数（1年）",
    },
    fireInsurancePayments: {
      statsDataId: "0000010111",
      cdCat01: "K2205",
      unit: "件",
      name: "火災保険保険金支払件数（1年）",
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
              onClick={() => setActiveTab("fireDepartmentCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDepartmentCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防本部・署数
            </button>
            <button
              onClick={() => setActiveTab("fireDepartmentEmployees")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDepartmentEmployees"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防職員数
            </button>
            <button
              onClick={() => setActiveTab("fireOfficers")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireOfficers"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防吏員数
            </button>
            <button
              onClick={() => setActiveTab("fireBrigadeCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireBrigadeCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防団数
            </button>
            <button
              onClick={() => setActiveTab("fireDivisionCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDivisionCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防分団数
            </button>
            <button
              onClick={() => setActiveTab("fireMembers")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireMembers"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防団員数
            </button>
            <button
              onClick={() => setActiveTab("pumpCars")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pumpCars"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ポンプ車数
            </button>
            <button
              onClick={() => setActiveTab("waterSources")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "waterSources"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消防水利数
            </button>
            <button
              onClick={() => setActiveTab("dispatchCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dispatchCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              出動回数
            </button>
            <button
              onClick={() => setActiveTab("fireDispatchCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDispatchCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災出動回数
            </button>
            <button
              onClick={() => setActiveTab("disasterDispatchCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "disasterDispatchCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              災害出動回数
            </button>
            <button
              onClick={() => setActiveTab("emergencyCars")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "emergencyCars"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              救急車数
            </button>
            <button
              onClick={() => setActiveTab("emergencyDispatchCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "emergencyDispatchCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              救急出動件数
            </button>
            <button
              onClick={() => setActiveTab("transferDispatchCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transferDispatchCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              転院搬送件数
            </button>
            <button
              onClick={() => setActiveTab("fireOutbreakCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireOutbreakCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              出火件数
            </button>
            <button
              onClick={() => setActiveTab("buildingFireCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "buildingFireCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              建物火災件数
            </button>
            <button
              onClick={() => setActiveTab("fireDamageArea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDamageArea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              焼損床面積
            </button>
            <button
              onClick={() => setActiveTab("fireDamageAmount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDamageAmount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災損害額
            </button>
            <button
              onClick={() => setActiveTab("buildingFireDamageAmount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "buildingFireDamageAmount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              建物火災損害額
            </button>
            <button
              onClick={() => setActiveTab("fireDamageHouseholds")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDamageHouseholds"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              り災世帯数
            </button>
            <button
              onClick={() => setActiveTab("fireDamagePersons")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDamagePersons"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              り災人員数
            </button>
            <button
              onClick={() => setActiveTab("fireCasualties")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireCasualties"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災死傷者数
            </button>
            <button
              onClick={() => setActiveTab("fireDeaths")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireDeaths"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災死亡者数
            </button>
            <button
              onClick={() => setActiveTab("fireInjuries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireInjuries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災負傷者数
            </button>
            <button
              onClick={() => setActiveTab("fireInsuranceNewContracts")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireInsuranceNewContracts"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災保険新契約
            </button>
            <button
              onClick={() => setActiveTab("fireInsurancePayments")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fireInsurancePayments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              火災保険支払
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
