"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface SportsFacilitiesPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const SportsFacilitiesPage: React.FC<SportsFacilitiesPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010107";
  const cdCat01 = {
    G1321: "G1321", // 社会体育施設数
    G1323: "G1323", // 多目的運動広場数
    G1325: "G1325", // 体育館数
    G1326: "G1326", // 水泳プール数
  };

  const statsDataIdRatio = "0000010207";
  const cdCat01Ratio = {
    G1321: "G01321", // 社会体育施設数（人口100万人当たり）
    G1323: "G01323", // 多目的運動広場数（人口100万人当たり）
    G1325: "G01325", // 体育館数（人口100万人当たり）
    G1326: "G01326", // 水泳プール数（人口100万人当たり）
    G42111: "G042111", // スポーツの年間行動者率（10歳以上）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1321,
            }}
            areaCode="00000"
            title="全国社会体育施設数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1323,
            }}
            areaCode="00000"
            title="全国多目的運動広場数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1325,
            }}
            areaCode="00000"
            title="全国体育館数"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G1326,
            }}
            areaCode="00000"
            title="全国水泳プール数"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.G42111,
            }}
            areaCode="00000"
            title="スポーツ年間行動者率（10歳以上）"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        
      </div>
    </SubcategoryLayout>
  );
};
