"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { ChildcareEarlyEducationRanking } from "./ChildcareEarlyEducationRanking";

interface ChildcareEarlyEducationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ChildcareEarlyEducationPage: React.FC<
  ChildcareEarlyEducationPageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010105";
  const cdCat01 = {
    E5101: "E5101", // 保育所等数
    E5201: "E5201", // 認定こども園数
  };

  const statsDataIdRatio = "0000010205";
  const cdCat01Ratio = {
    E5101: "E0110105", // 保育所等数（0～5歳人口10万人当たり）
    E5201: "E0110106", // 認定こども園数（0～5歳人口10万人当たり）
    E5101Ratio: "E01305", // 公営保育所等割合
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E5101,
            }}
            areaCode="00000"
            title="全国保育所等数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E5201,
            }}
            areaCode="00000"
            title="全国認定こども園数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E5101,
            }}
            areaCode="00000"
            title="保育所等数（0～5歳人口10万人当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E5201,
            }}
            areaCode="00000"
            title="認定こども園数（0～5歳人口10万人当たり）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01Ratio.E5101Ratio,
            }}
            areaCode="00000"
            title="公営保育所等割合"
            color="#06b6d4"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <ChildcareEarlyEducationRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
