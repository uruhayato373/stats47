"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface WelfareFacilitiesRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "protectionFacilities"
  | "nursingHomes"
  | "seniorWelfareCenters"
  | "seniorRecreationHomes"
  | "paidNursingHomes"
  | "nursingWelfareFacilities"
  | "physicalDisabilityFacilities"
  | "intellectualDisabilityFacilities"
  | "childWelfareFacilities"
  | "protectionFacilityStaff"
  | "nursingHomeStaff"
  | "seniorWelfareCenterStaff"
  | "seniorRecreationHomeStaff"
  | "physicalDisabilityFacilityStaff"
  | "intellectualDisabilityFacilityStaff"
  | "childWelfareFacilityStaff"
  | "protectionFacilityCapacity"
  | "protectionFacilityResidents"
  | "nursingHomeCapacity"
  | "nursingHomeResidents"
  | "paidNursingHomeCapacity"
  | "paidNursingHomeResidents"
  | "physicalDisabilityFacilityCapacity"
  | "physicalDisabilityFacilityResidents"
  | "intellectualDisabilityFacilityCapacity"
  | "intellectualDisabilityFacilityResidents"
  | "welfareCommissioners"
  | "homeHelpers"
  | "homeHelperUsers"
  | "welfareCommissionerConsultations"
  | "publicAssistanceApplications"
  | "physicalDisabilityRehabilitationCases"
  | "intellectualDisabilityConsultations"
  | "physicalDisabilityRehabilitationCenterCases"
  | "intellectualDisabilityRehabilitationCenterCases"
  | "lateElderlyMedicalExpense"
  | "municipalIntellectualDisabilityConsultations"
  | "childConsultationCenterCases";

export const WelfareFacilitiesRanking: React.FC<
  WelfareFacilitiesRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>(
    "protectionFacilities"
  );

  const rankings = {
    protectionFacilities: {
      statsDataId: "0000010210",
      cdCat01: "#J02101",
      unit: "所",
      name: "保護施設数（生活保護被保護実人員10万人当たり）",
    },
    nursingHomes: {
      statsDataId: "0000010210",
      cdCat01: "#J022011",
      unit: "所",
      name: "老人ホーム数（65歳以上人口10万人当たり）",
    },
    seniorWelfareCenters: {
      statsDataId: "0000010210",
      cdCat01: "#J02202",
      unit: "所",
      name: "老人福祉センター数（65歳以上人口10万人当たり）",
    },
    seniorRecreationHomes: {
      statsDataId: "0000010210",
      cdCat01: "#J02203",
      unit: "所",
      name: "老人憩の家数（65歳以上人口10万人当たり）",
    },
    paidNursingHomes: {
      statsDataId: "0000010210",
      cdCat01: "#J02204",
      unit: "所",
      name: "有料老人ホーム数（65歳以上人口10万人当たり）",
    },
    nursingWelfareFacilities: {
      statsDataId: "0000010210",
      cdCat01: "#J02205",
      unit: "所",
      name: "介護老人福祉施設数（65歳以上人口10万人当たり）",
    },
    physicalDisabilityFacilities: {
      statsDataId: "0000010210",
      cdCat01: "#J02301",
      unit: "所",
      name: "身体障害者更生援護施設数（人口100万人当たり）",
    },
    intellectualDisabilityFacilities: {
      statsDataId: "0000010210",
      cdCat01: "#J02401",
      unit: "所",
      name: "知的障害者援護施設数（人口100万人当たり）",
    },
    childWelfareFacilities: {
      statsDataId: "0000010210",
      cdCat01: "#J02501",
      unit: "所",
      name: "児童福祉施設等数（人口10万人当たり）",
    },
    protectionFacilityStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03101",
      unit: "人",
      name: "保護施設従事者数（生活保護被保護実人員千人当たり）",
    },
    nursingHomeStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J032011",
      unit: "人",
      name: "老人ホーム従事者数（65歳以上人口10万人当たり）",
    },
    seniorWelfareCenterStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03202",
      unit: "人",
      name: "老人福祉センター従事者数（65歳以上人口10万人当たり）",
    },
    seniorRecreationHomeStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03203",
      unit: "人",
      name: "老人憩の家従事者数（65歳以上人口10万人当たり）",
    },
    physicalDisabilityFacilityStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03301",
      unit: "人",
      name: "身体障害者更生援護施設従事者数（人口10万人当たり）",
    },
    intellectualDisabilityFacilityStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03401",
      unit: "人",
      name: "知的障害者援護施設従事者数（人口10万人当たり）",
    },
    childWelfareFacilityStaff: {
      statsDataId: "0000010210",
      cdCat01: "#J03501",
      unit: "人",
      name: "児童福祉施設等従事者数（人口10万人当たり）",
    },
    protectionFacilityCapacity: {
      statsDataId: "0000010210",
      cdCat01: "#J04101",
      unit: "人",
      name: "生活保護施設定員数（被保護実人員千人当たり）",
    },
    protectionFacilityResidents: {
      statsDataId: "0000010210",
      cdCat01: "#J04102",
      unit: "人",
      name: "生活保護施設在所者数（被保護実人員千人当たり）",
    },
    nursingHomeCapacity: {
      statsDataId: "0000010210",
      cdCat01: "#J042011",
      unit: "人",
      name: "老人ホーム定員数（65歳以上人口千人当たり）",
    },
    nursingHomeResidents: {
      statsDataId: "0000010210",
      cdCat01: "#J042021",
      unit: "人",
      name: "老人ホーム在所者数（65歳以上人口千人当たり）",
    },
    paidNursingHomeCapacity: {
      statsDataId: "0000010210",
      cdCat01: "#J04203",
      unit: "人",
      name: "有料老人ホーム定員数（65歳以上人口千人当たり）",
    },
    paidNursingHomeResidents: {
      statsDataId: "0000010210",
      cdCat01: "#J04204",
      unit: "人",
      name: "有料老人ホーム在所者数（65歳以上人口千人当たり）",
    },
    physicalDisabilityFacilityCapacity: {
      statsDataId: "0000010210",
      cdCat01: "#J04301",
      unit: "人",
      name: "身体障害者更生援護施設定員数（人口10万人当たり）",
    },
    physicalDisabilityFacilityResidents: {
      statsDataId: "0000010210",
      cdCat01: "#J04302",
      unit: "人",
      name: "身体障害者更生援護施設在所者数（人口10万人当たり）",
    },
    intellectualDisabilityFacilityCapacity: {
      statsDataId: "0000010210",
      cdCat01: "#J04401",
      unit: "人",
      name: "知的障害者援護施設定員数（人口10万人当たり）",
    },
    intellectualDisabilityFacilityResidents: {
      statsDataId: "0000010210",
      cdCat01: "#J04402",
      unit: "人",
      name: "知的障害者援護施設在所者数（人口10万人当たり）",
    },
    welfareCommissioners: {
      statsDataId: "0000010210",
      cdCat01: "#J05101",
      unit: "人",
      name: "民生委員（児童委員）数（人口10万人当たり）",
    },
    homeHelpers: {
      statsDataId: "0000010210",
      cdCat01: "#J05108",
      unit: "人",
      name: "訪問介護員（ホームヘルパー）数（人口10万人当たり）",
    },
    homeHelperUsers: {
      statsDataId: "0000010210",
      cdCat01: "#J05109",
      unit: "人",
      name: "訪問介護利用者数（訪問介護1事業所当たり）",
    },
    welfareCommissionerConsultations: {
      statsDataId: "0000010210",
      cdCat01: "#J05201",
      unit: "件",
      name: "民生委員（児童委員）1人当たり相談・支援件数",
    },
    publicAssistanceApplications: {
      statsDataId: "0000010210",
      cdCat01: "#J05202",
      unit: "件",
      name: "福祉事務所生活保護申請件数（被保護世帯千世帯当たり）",
    },
    physicalDisabilityRehabilitationCases: {
      statsDataId: "0000010210",
      cdCat01: "#J05203",
      unit: "人",
      name: "身体障害者更生援護取扱実人員（人口千人当たり）",
    },
    intellectualDisabilityConsultations: {
      statsDataId: "0000010210",
      cdCat01: "#J05204",
      unit: "人",
      name: "福祉事務所知的障害者相談実人員（人口10万人当たり）",
    },
    physicalDisabilityRehabilitationCenterCases: {
      statsDataId: "0000010210",
      cdCat01: "#J05206",
      unit: "人",
      name: "身体障害者更生相談所取扱実人員（人口千人当たり）",
    },
    intellectualDisabilityRehabilitationCenterCases: {
      statsDataId: "0000010210",
      cdCat01: "#J05207",
      unit: "人",
      name: "知的障害者更生相談所取扱実人員（人口10万人当たり）",
    },
    lateElderlyMedicalExpense: {
      statsDataId: "0000010210",
      cdCat01: "#J05208",
      unit: "円",
      name: "後期高齢者医療費（被保険者1人当たり）",
    },
    municipalIntellectualDisabilityConsultations: {
      statsDataId: "0000010210",
      cdCat01: "#J05209",
      unit: "人",
      name: "市町村における知的障害者相談実人員（人口10万人当たり）",
    },
    childConsultationCenterCases: {
      statsDataId: "0000010210",
      cdCat01: "#J05210",
      unit: "件",
      name: "児童相談所受付件数（人口千人当たり）",
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
              onClick={() => setActiveTab("protectionFacilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "protectionFacilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              保護施設数
            </button>
            <button
              onClick={() => setActiveTab("nursingHomes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nursingHomes"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              老人ホーム数
            </button>
            <button
              onClick={() => setActiveTab("seniorWelfareCenters")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "seniorWelfareCenters"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              老人福祉センター数
            </button>
            <button
              onClick={() => setActiveTab("seniorRecreationHomes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "seniorRecreationHomes"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              老人憩の家数
            </button>
            <button
              onClick={() => setActiveTab("paidNursingHomes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "paidNursingHomes"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              有料老人ホーム数
            </button>
            <button
              onClick={() => setActiveTab("nursingWelfareFacilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nursingWelfareFacilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              介護老人福祉施設数
            </button>
            <button
              onClick={() => setActiveTab("physicalDisabilityFacilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "physicalDisabilityFacilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              身体障害者施設数
            </button>
            <button
              onClick={() => setActiveTab("intellectualDisabilityFacilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "intellectualDisabilityFacilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              知的障害者施設数
            </button>
            <button
              onClick={() => setActiveTab("childWelfareFacilities")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "childWelfareFacilities"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              児童福祉施設数
            </button>
            <button
              onClick={() => setActiveTab("welfareCommissioners")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "welfareCommissioners"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              民生委員数
            </button>
            <button
              onClick={() => setActiveTab("homeHelpers")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "homeHelpers"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ホームヘルパー数
            </button>
            <button
              onClick={() => setActiveTab("childConsultationCenterCases")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "childConsultationCenterCases"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              児童相談所受付件数
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
