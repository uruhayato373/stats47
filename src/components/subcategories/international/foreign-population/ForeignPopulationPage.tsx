"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface ForeignPopulationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ForeignPopulationPage: React.FC<ForeignPopulationPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010201";
  const cdCat01 = {
    A01601: "A01601", // 外国人人口（人口10万人当たり）
    A0160101: "A0160101", // 外国人人口（韓国、朝鮮）（人口10万人当たり）
    A0160102: "A0160102", // 外国人人口（中国）（人口10万人当たり）
    A0160103: "A0160103", // 外国人人口（アメリカ）（人口10万人当たり）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.A01601,
            }}
            areaCode="00000"
            title="外国人人口（人口10万人当たり）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.A0160101,
            }}
            areaCode="00000"
            title="韓国・朝鮮系外国人人口（人口10万人当たり）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.A0160102,
            }}
            areaCode="00000"
            title="中国系外国人人口（人口10万人当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.A0160103,
            }}
            areaCode="00000"
            title="アメリカ系外国人人口（人口10万人当たり）"
            color="#ef4444"
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
