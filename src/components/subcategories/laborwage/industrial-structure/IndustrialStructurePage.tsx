"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface IndustrialStructurePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const IndustrialStructurePage: React.FC<
  IndustrialStructurePageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010206";
  const cdCat01 = {
    F1201: "F01201", // 第1次産業就業者比率
    F1202: "F01202", // 第2次産業就業者比率
    F1203: "F01203", // 第3次産業就業者比率
    F1204: "F01204", // 第2次産業及び第3次産業就業者比率（対就業者）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1201,
            }}
            areaCode="00000"
            title="第1次産業就業者比率"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1202,
            }}
            areaCode="00000"
            title="第2次産業就業者比率"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1203,
            }}
            areaCode="00000"
            title="第3次産業就業者比率"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1204,
            }}
            areaCode="00000"
            title="第2次・第3次産業就業者比率"
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
