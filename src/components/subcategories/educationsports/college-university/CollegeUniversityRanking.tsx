"use client";

import React, { useState } from "react";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { SubcategoryData } from "@/types/choropleth";

interface CollegeUniversityRankingProps {
  subcategory: SubcategoryData;
}

type RankingTab =
  | "collegeCount"
  | "universityCount"
  | "collegeStudents"
  | "universityStudents";

export const CollegeUniversityRanking: React.FC<
  CollegeUniversityRankingProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("collegeCount");

  const rankings = {
    collegeCount: {
      statsDataId: "0000010105",
      cdCat01: "E5101",
      unit: "校",
      name: "短期大学数",
    },
    universityCount: {
      statsDataId: "0000010105",
      cdCat01: "E5201",
      unit: "校",
      name: "大学数",
    },
    collegeStudents: {
      statsDataId: "0000010105",
      cdCat01: "E5301",
      unit: "人",
      name: "短期大学生数",
    },
    universityStudents: {
      statsDataId: "0000010105",
      cdCat01: "E5401",
      unit: "人",
      name: "大学生数",
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
              onClick={() => setActiveTab("collegeCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "collegeCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              短期大学数
            </button>
            <button
              onClick={() => setActiveTab("universityCount")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "universityCount"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              大学数
            </button>
            <button
              onClick={() => setActiveTab("collegeStudents")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "collegeStudents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              短期大学生数
            </button>
            <button
              onClick={() => setActiveTab("universityStudents")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "universityStudents"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              大学生数
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
