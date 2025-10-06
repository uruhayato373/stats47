"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface MarriagePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const MarriagePage: React.FC<MarriagePageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    marriages: "A9101", // 婚姻件数
    divorces: "A9201", // 離婚件数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 婚姻件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.marriages,
            }}
            areaCode="00000"
            title="全国婚姻件数"
            unit="組"
            color="#9333ea"
          />

          {/* 離婚件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.divorces,
            }}
            areaCode="00000"
            title="全国離婚件数"
            unit="組"
            color="#f97316"
          />
        </div>
      </div>

      {/* コロプレス地図とデータテーブル */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.marriages,
        }}
        subcategory={{
          ...subcategory,
          unit: "組",
          name: "婚姻件数",
        }}
        title="婚姻件数ランキング"
        options={{
          colorScheme: subcategory.colorScheme || "interpolatePurples",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
