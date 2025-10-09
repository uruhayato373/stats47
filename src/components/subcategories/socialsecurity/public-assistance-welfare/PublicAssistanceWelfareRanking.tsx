"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface PublicAssistanceWelfareRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "householdsOnAssistance"
  | "personsOnAssistance"
  | "educationBeneficiaries"
  | "medicalBeneficiaries"
  | "housingBeneficiaries"
  | "nursingBeneficiaries"
  | "elderlyOnAssistance"
  | "disabilityCertificates";

export const PublicAssistanceWelfareRanking: React.FC<
  PublicAssistanceWelfareRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "householdsOnAssistance"
  );

  const rankings = {
    householdsOnAssistance: {
      statsDataId: "0000010210",
      cdCat01: "#J01101",
      unit: "世帯",
      name: "生活保護被保護実世帯数（月平均一般世帯千世帯当たり）",
    },
    personsOnAssistance: {
      statsDataId: "0000010210",
      cdCat01: "#J01107",
      unit: "人",
      name: "生活保護被保護実人員（月平均人口千人当たり）",
    },
    educationBeneficiaries: {
      statsDataId: "0000010210",
      cdCat01: "#J0110803",
      unit: "人",
      name: "生活保護教育扶助人員（月平均人口千人当たり）",
    },
    medicalBeneficiaries: {
      statsDataId: "0000010210",
      cdCat01: "#J0110804",
      unit: "人",
      name: "生活保護医療扶助人員（月平均人口千人当たり）",
    },
    housingBeneficiaries: {
      statsDataId: "0000010210",
      cdCat01: "#J0110805",
      unit: "人",
      name: "生活保護住宅扶助人員（月平均人口千人当たり）",
    },
    nursingBeneficiaries: {
      statsDataId: "0000010210",
      cdCat01: "#J0110806",
      unit: "人",
      name: "生活保護介護扶助人員（月平均人口千人当たり）",
    },
    elderlyOnAssistance: {
      statsDataId: "0000010210",
      cdCat01: "#J0110902",
      unit: "人",
      name: "生活保護被保護高齢者数（月平均65歳以上人口千人当たり）",
    },
    disabilityCertificates: {
      statsDataId: "0000010210",
      cdCat01: "#J01200",
      unit: "人",
      name: "身体障害者手帳交付数（人口千人当たり）",
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
              onClick={() => setActiveTab("householdsOnAssistance")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "householdsOnAssistance"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              被保護世帯数
            </button>
            <button
              onClick={() => setActiveTab("personsOnAssistance")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "personsOnAssistance"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              被保護人員数
            </button>
            <button
              onClick={() => setActiveTab("educationBeneficiaries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "educationBeneficiaries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              教育扶助人員
            </button>
            <button
              onClick={() => setActiveTab("medicalBeneficiaries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "medicalBeneficiaries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              医療扶助人員
            </button>
            <button
              onClick={() => setActiveTab("housingBeneficiaries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "housingBeneficiaries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              住宅扶助人員
            </button>
            <button
              onClick={() => setActiveTab("nursingBeneficiaries")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nursingBeneficiaries"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              介護扶助人員
            </button>
            <button
              onClick={() => setActiveTab("elderlyOnAssistance")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "elderlyOnAssistance"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              被保護高齢者数
            </button>
            <button
              onClick={() => setActiveTab("disabilityCertificates")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "disabilityCertificates"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              身体障害者手帳交付数
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
          colorScheme: subcategory.colorScheme || "interpolateReds",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </>
  );
};
