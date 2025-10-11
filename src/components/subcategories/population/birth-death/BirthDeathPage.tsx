"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface BirthDeathPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BirthDeathPage: React.FC<BirthDeathPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    births: "A4101", // 出生数
    deaths: "A4200", // 死亡数
    naturalIncrease: "A4301", // 自然増減数
    totalFertilityRate: "A4103", // 合計特殊出生率
    naturalIncreaseRate: "A4401", // 自然増減率
    birthRate: "A4102", // 出生率
    deathRate: "A4201", // 死亡率
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 出生数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.births,
            }}
            areaCode="00000"
            title="全国出生数"
            color="#10b981"
          />

          {/* 死亡数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deaths,
            }}
            areaCode="00000"
            title="全国死亡数"
            color="#ef4444"
          />

          {/* 自然増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.naturalIncrease,
            }}
            areaCode="00000"
            title="全国自然増減数"
            color="#3b82f6"
          />

          {/* 合計特殊出生率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalFertilityRate,
            }}
            areaCode="00000"
            title="全国合計特殊出生率"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* ランキング */}
      <div className="px-4 pb-4">
        
      </div>
    </SubcategoryLayout>
  );
};
