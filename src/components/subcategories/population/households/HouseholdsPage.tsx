"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface HouseholdsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const HouseholdsPage: React.FC<HouseholdsPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010108";
  const cdCat01 = {
    totalHouseholds: "H3100", // 総世帯数
    ordinaryHouseholds: "H3110", // 普通世帯数
    floorAreaPerHousehold: "H3661", // 1世帯当たり延べ面積（主世帯）
    householdsWithElderly: "H311110", // 65歳以上の世帯員のいる主世帯数
    floorAreaPerPerson: "H3671", // 1人当たり延べ面積（主世帯）
    elderlySingleHouseholds: "H3261", // 住宅に住む高齢単身世帯数（65歳以上）
    elderlyCoupleHouseholds: "H3271", // 住宅に住む高齢夫婦世帯数
    singleMotherHouseholds: "H3230", // 住宅に住む母子世帯数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 総世帯数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalHouseholds,
            }}
            areaCode="00000"
            title="全国総世帯数"
            color="#8b5cf6"
          />

          {/* 普通世帯数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.ordinaryHouseholds,
            }}
            areaCode="00000"
            title="全国普通世帯数"
            color="#3b82f6"
          />

          {/* 1世帯当たり延べ面積 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.floorAreaPerHousehold,
            }}
            areaCode="00000"
            title="1世帯当たり延べ面積"
            color="#10b981"
          />

          {/* 65歳以上世帯員のいる世帯 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.householdsWithElderly,
            }}
            areaCode="00000"
            title="65歳以上世帯員世帯"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* コロプレス地図とデータテーブル */}
      
    </SubcategoryLayout>
  );
};
