"use client";

import React, { useState } from "react";
import { SubcategoryDashboardPageProps } from "@/types/shared/subcategory";
import { EstatStatisticsMetricCard } from "@/components/organisms/estat-api/EstatStatisticsMetricCard";
import { EstatGenderDonutChart } from "@/components/dashboard/GenderDonutChart";

type RankingTab = "total" | "china" | "korea" | "philippines" | "brazil";

export const ForeignersNationalDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ subcategory }) => {
  const [activeTab, setActiveTab] = useState<RankingTab>("total");

  const statsDataId = "0000010101";
  const cdCat01 = {
    totalForeigners: "A1700",
    maleForeigners: "A170001",
    femaleForeigners: "A170002",
    korea: "A1701",
    china: "A1702",
    usa: "A1703",
    philippines: "A1706",
    brazil: "A1707",
  };

  const rankings = {
    total: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.totalForeigners,
      unit: "人",
      name: "外国人人口",
    },
    china: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.china,
      unit: "人",
      name: "中国人人口",
    },
    korea: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.korea,
      unit: "人",
      name: "韓国・朝鮮人人口",
    },
    philippines: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.philippines,
      unit: "人",
      name: "フィリピン人人口",
    },
    brazil: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.brazil,
      unit: "人",
      name: "ブラジル人人口",
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <div className="flex-1">
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalForeigners,
            }}
            areaCode="00000"
            title="全国外国人人口"
            color="#4f46e5"
          />
          <EstatStatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.china,
            }}
            areaCode="00000"
            title="全国中国人人口"
            color="#10b981"
          />
          <EstatGenderDonutChart
            params={{
              statsDataId: statsDataId,
            }}
            maleCategoryCode={cdCat01.maleForeigners}
            femaleCategoryCode={cdCat01.femaleForeigners}
            areaCode="00000"
            title="外国人男女比率"
            width={300}
            height={300}
          />
        </div>
      </div>

      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("total")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "total"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              総数
            </button>
            <button
              onClick={() => setActiveTab("china")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "china"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              中国
            </button>
            <button
              onClick={() => setActiveTab("korea")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "korea"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              韓国・朝鮮
            </button>
            <button
              onClick={() => setActiveTab("philippines")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "philippines"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              フィリピン
            </button>
            <button
              onClick={() => setActiveTab("brazil")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "brazil"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ブラジル
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
