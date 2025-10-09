"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface HouseholdEconomyRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "actualIncome"
  | "householdHeadIncome"
  | "consumptionExpenditure"
  | "avgPropensityToConsume"
  | "foodExpenditureRatio"
  | "housingExpenditureRatio"
  | "utilitiesExpenditureRatio"
  | "furnitureExpenditureRatio"
  | "clothingExpenditureRatio"
  | "healthcareExpenditureRatio"
  | "transportExpenditureRatio"
  | "educationExpenditureRatio"
  | "cultureExpenditureRatio"
  | "otherExpenditureRatio"
  | "cpiChangeRateTotal"
  | "cpiChangeRateExclOwnerRent"
  | "cpiChangeRateExclFreshFood"
  | "cpiChangeRateFood"
  | "cpiChangeRateHousing"
  | "cpiChangeRateUtilities";

export const HouseholdEconomyRanking: React.FC<
  HouseholdEconomyRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("actualIncome");

  const rankings = {
    actualIncome: {
      statsDataId: "0000010212",
      cdCat01: "#L01201",
      unit: "千円",
      name: "実収入（二人以上の世帯のうち勤労者世帯）（1世帯当たり1か月間）",
    },
    householdHeadIncome: {
      statsDataId: "0000010212",
      cdCat01: "#L01204",
      unit: "千円",
      name: "世帯主収入（二人以上の世帯のうち勤労者世帯）（1世帯当たり1か月間）",
    },
    consumptionExpenditure: {
      statsDataId: "0000010212",
      cdCat01: "#L02211",
      unit: "千円",
      name: "消費支出（二人以上の世帯）（1世帯当たり1か月間）",
    },
    avgPropensityToConsume: {
      statsDataId: "0000010212",
      cdCat01: "#L02602",
      unit: "%",
      name: "平均消費性向（二人以上の世帯のうち勤労者世帯）",
    },
    foodExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02411",
      unit: "%",
      name: "食料費割合（二人以上の世帯）",
    },
    housingExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02412",
      unit: "%",
      name: "住居費割合（二人以上の世帯）",
    },
    utilitiesExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02413",
      unit: "%",
      name: "光熱・水道費割合（二人以上の世帯）",
    },
    furnitureExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02414",
      unit: "%",
      name: "家具・家事用品費割合（二人以上の世帯）",
    },
    clothingExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02415",
      unit: "%",
      name: "被服及び履物費割合（二人以上の世帯）",
    },
    healthcareExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02416",
      unit: "%",
      name: "保健医療費割合（二人以上の世帯）",
    },
    transportExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02417",
      unit: "%",
      name: "交通・通信費割合（二人以上の世帯）",
    },
    educationExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02418",
      unit: "%",
      name: "教育費割合（二人以上の世帯）",
    },
    cultureExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02419",
      unit: "%",
      name: "教養娯楽費割合（二人以上の世帯）",
    },
    otherExpenditureRatio: {
      statsDataId: "0000010212",
      cdCat01: "#L02420",
      unit: "%",
      name: "その他の消費支出割合（二人以上の世帯）",
    },
    cpiChangeRateTotal: {
      statsDataId: "0000010212",
      cdCat01: "#L04101",
      unit: "%",
      name: "消費者物価指数対前年変化率（総合）",
    },
    cpiChangeRateExclOwnerRent: {
      statsDataId: "0000010212",
      cdCat01: "#L04102",
      unit: "%",
      name: "消費者物価指数対前年変化率（持ち家の帰属家賃を除く総合）",
    },
    cpiChangeRateExclFreshFood: {
      statsDataId: "0000010212",
      cdCat01: "#L04103",
      unit: "%",
      name: "消費者物価指数対前年変化率（生鮮食品を除く総合）",
    },
    cpiChangeRateFood: {
      statsDataId: "0000010212",
      cdCat01: "#L04104",
      unit: "%",
      name: "消費者物価指数対前年変化率（食料）",
    },
    cpiChangeRateHousing: {
      statsDataId: "0000010212",
      cdCat01: "#L04105",
      unit: "%",
      name: "消費者物価指数対前年変化率（住居）",
    },
    cpiChangeRateUtilities: {
      statsDataId: "0000010212",
      cdCat01: "#L04106",
      unit: "%",
      name: "消費者物価指数対前年変化率（光熱・水道）",
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
              onClick={() => setActiveTab("actualIncome")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "actualIncome"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              実収入
            </button>
            <button
              onClick={() => setActiveTab("householdHeadIncome")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "householdHeadIncome"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              世帯主収入
            </button>
            <button
              onClick={() => setActiveTab("consumptionExpenditure")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "consumptionExpenditure"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消費支出
            </button>
            <button
              onClick={() => setActiveTab("avgPropensityToConsume")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "avgPropensityToConsume"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              消費性向
            </button>
            <button
              onClick={() => setActiveTab("foodExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "foodExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              食料費割合
            </button>
            <button
              onClick={() => setActiveTab("housingExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "housingExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              住居費割合
            </button>
            <button
              onClick={() => setActiveTab("utilitiesExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "utilitiesExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              光熱・水道費割合
            </button>
            <button
              onClick={() => setActiveTab("furnitureExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "furnitureExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              家具・家事用品費割合
            </button>
            <button
              onClick={() => setActiveTab("clothingExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "clothingExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              被服・履物費割合
            </button>
            <button
              onClick={() => setActiveTab("healthcareExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "healthcareExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保健医療費割合
            </button>
            <button
              onClick={() => setActiveTab("transportExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "transportExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              交通・通信費割合
            </button>
            <button
              onClick={() => setActiveTab("educationExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "educationExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              教育費割合
            </button>
            <button
              onClick={() => setActiveTab("cultureExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cultureExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              教養娯楽費割合
            </button>
            <button
              onClick={() => setActiveTab("otherExpenditureRatio")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "otherExpenditureRatio"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              その他支出割合
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateTotal")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateTotal"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（総合）
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateExclOwnerRent")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateExclOwnerRent"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（除く家賃）
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateExclFreshFood")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateExclFreshFood"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（除く生鮮）
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateFood")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateFood"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（食料）
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateHousing")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateHousing"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（住居）
            </button>
            <button
              onClick={() => setActiveTab("cpiChangeRateUtilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cpiChangeRateUtilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              物価指数（光熱・水道）
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
