"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface LandUsePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandUsePage: React.FC<LandUsePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010102";
  const cdCat01 = {
    totalLandArea: "B1201", // 評価総地積（課税対象土地）
    residentialLand: "B120103", // 評価総地積（宅地）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalLandArea,
            }}
            areaCode="00000"
            title="全国評価総地積"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.residentialLand,
            }}
            areaCode="00000"
            title="全国宅地面積"
            color="#10b981"
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
