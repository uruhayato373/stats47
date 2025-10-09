"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { CulturalFacilitiesRanking } from "./CulturalFacilitiesRanking";

interface CulturalFacilitiesPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CulturalFacilitiesPage: React.FC<CulturalFacilitiesPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010107";
  const cdCat01 = {
    G1101: "G1101", // 公民館数
    G1104: "G1104", // 図書館数
    G1107: "G1107", // 博物館数
    G1109: "G1109", // 青少年教育施設数
  };

  const statsDataIdRatio = "0000010207";
  const cdCat01Ratio = {
    G1101: "G01101", // 公民館数（人口100万人当たり）
    G1104: "G01104", // 図書館数（人口100万人当たり）
    G1107: "G01107", // 博物館数（人口100万人当たり）
    G1109: "G01109", // 青少年教育施設数（人口100万人当たり）
    G3201: "G03201", // 青少年学級・講座数（人口100万人当たり）
    G3203: "G03203", // 成人一般学級・講座数（人口100万人当たり）
    G320501: "G0320501", // 女性学級・講座数（女性人口100万人当たり）
    G3207: "G03207", // 高齢者学級・講座数（人口100万人当たり）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1101,
            }}
            areaCode="00000"
            title="全国公民館数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1104,
            }}
            areaCode="00000"
            title="全国図書館数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1107,
            }}
            areaCode="00000"
            title="全国博物館数"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1109,
            }}
            areaCode="00000"
            title="全国青少年教育施設数"
            color="#ef4444"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <CulturalFacilitiesRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
