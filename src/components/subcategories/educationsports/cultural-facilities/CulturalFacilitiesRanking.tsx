"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryData } from "@/types/choropleth";

interface CulturalFacilitiesRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "publicHall"
  | "library"
  | "museum"
  | "youthEducation"
  | "youthClassLecture"
  | "adultClassLecture"
  | "femaleClassLecture"
  | "elderlyClassLecture";

export const CulturalFacilitiesRanking: React.FC<
  CulturalFacilitiesRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("publicHall");

  const rankings = {
    publicHall: {
      statsDataId: "0000010207",
      cdCat01: "#G01101",
      unit: "館",
      name: "公民館数（人口100万人当たり）",
    },
    library: {
      statsDataId: "0000010207",
      cdCat01: "#G01104",
      unit: "館",
      name: "図書館数（人口100万人当たり）",
    },
    museum: {
      statsDataId: "0000010207",
      cdCat01: "#G01107",
      unit: "館",
      name: "博物館数（人口100万人当たり）",
    },
    youthEducation: {
      statsDataId: "0000010207",
      cdCat01: "#G01109",
      unit: "所",
      name: "青少年教育施設数（人口100万人当たり）",
    },
    youthClassLecture: {
      statsDataId: "0000010207",
      cdCat01: "#G03201",
      unit: "学級・講座",
      name: "青少年学級・講座数（人口100万人当たり）",
    },
    adultClassLecture: {
      statsDataId: "0000010207",
      cdCat01: "#G03203",
      unit: "学級・講座",
      name: "成人一般学級・講座数（人口100万人当たり）",
    },
    femaleClassLecture: {
      statsDataId: "0000010207",
      cdCat01: "#G0320501",
      unit: "学級・講座",
      name: "女性学級・講座数（女性人口100万人当たり）",
    },
    elderlyClassLecture: {
      statsDataId: "0000010207",
      cdCat01: "#G03207",
      unit: "学級・講座",
      name: "高齢者学級・講座数（人口100万人当たり）",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <>
      {/* タブ */}
      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("publicHall")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publicHall"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              公民館
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "library"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              図書館
            </button>
            <button
              onClick={() => setActiveTab("museum")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "museum"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              博物館
            </button>
            <button
              onClick={() => setActiveTab("youthEducation")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "youthEducation"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              青少年教育施設
            </button>
            <button
              onClick={() => setActiveTab("youthClassLecture")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "youthClassLecture"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              青少年学級・講座
            </button>
            <button
              onClick={() => setActiveTab("adultClassLecture")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "adultClassLecture"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              成人学級・講座
            </button>
            <button
              onClick={() => setActiveTab("femaleClassLecture")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "femaleClassLecture"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              女性学級・講座
            </button>
            <button
              onClick={() => setActiveTab("elderlyClassLecture")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "elderlyClassLecture"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              高齢者学級・講座
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
