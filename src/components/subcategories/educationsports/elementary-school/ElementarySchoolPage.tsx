"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { ElementarySchoolRanking } from "./ElementarySchoolRanking";

interface ElementarySchoolPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ElementarySchoolPage: React.FC<ElementarySchoolPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010105";
  const cdCat01 = {
    E2101: "E2101", // 小学校数
    E2201: "E2201", // 小学校児童数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E2101,
            }}
            areaCode="00000"
            title="全国小学校数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E2201,
            }}
            areaCode="00000"
            title="全国小学校児童数"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <ElementarySchoolRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
