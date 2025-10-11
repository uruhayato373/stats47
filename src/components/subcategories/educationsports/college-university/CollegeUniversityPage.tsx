"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface CollegeUniversityPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CollegeUniversityPage: React.FC<CollegeUniversityPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010105";
  const cdCat01 = {
    E5101: "E5101", // 短期大学数
    E5201: "E5201", // 大学数
    E5301: "E5301", // 短期大学生数
    E5401: "E5401", // 大学生数
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
            title="全国短期大学数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E5201,
            }}
            areaCode="00000"
            title="全国大学数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E5301,
            }}
            areaCode="00000"
            title="全国短期大学生数"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E5401,
            }}
            areaCode="00000"
            title="全国大学生数"
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
