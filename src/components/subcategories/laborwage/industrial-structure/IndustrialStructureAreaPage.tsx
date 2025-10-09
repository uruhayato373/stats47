"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface IndustrialStructureAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
}

export const IndustrialStructureAreaPage: React.FC<
  IndustrialStructureAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の産業構造
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1201,
            }}
            areaCode={areaCode}
            title="第1次産業就業者比率"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1202,
            }}
            areaCode={areaCode}
            title="第2次産業就業者比率"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1203,
            }}
            areaCode={areaCode}
            title="第3次産業就業者比率"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1204,
            }}
            areaCode={areaCode}
            title="第2次・第3次産業就業者比率"
            color="#ef4444"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
