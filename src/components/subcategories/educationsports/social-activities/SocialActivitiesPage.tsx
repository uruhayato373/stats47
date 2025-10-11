"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface SocialActivitiesPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const SocialActivitiesPage: React.FC<SocialActivitiesPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010207";
  const cdCat01 = {
    G4101: "G04101", // ボランティア活動の年間行動者率（15歳以上）
    G41011: "G041011", // ボランティア活動の年間行動者率（10歳以上）
    G42111: "G042111", // スポーツの年間行動者率（10歳以上）
    G430501: "G0430501", // 一般旅券発行件数（人口千人当たり）
    G4306: "G04306", // 旅行・行楽の年間行動者率（15歳以上）
    G43061: "G043061", // 旅行・行楽の年間行動者率（10歳以上）
    G4307: "G04307", // 海外旅行の年間行動者率（15歳以上）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G4101,
            }}
            areaCode="00000"
            title="ボランティア活動年間行動者率（15歳以上）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G41011,
            }}
            areaCode="00000"
            title="ボランティア活動年間行動者率（10歳以上）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G4306,
            }}
            areaCode="00000"
            title="旅行・行楽年間行動者率（15歳以上）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G43061,
            }}
            areaCode="00000"
            title="旅行・行楽年間行動者率（10歳以上）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G4307,
            }}
            areaCode="00000"
            title="海外旅行年間行動者率（15歳以上）"
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G430501,
            }}
            areaCode="00000"
            title="一般旅券発行件数（人口千人当たり）"
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
