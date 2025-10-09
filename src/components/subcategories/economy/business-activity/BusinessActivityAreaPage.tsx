"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface BusinessActivityAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
}

export const BusinessActivityAreaPage: React.FC<
  BusinessActivityAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
  const statsDataId = "0000010203";
  const cdCat01 = {
    C2102: "C02102", // 第2次産業事業所数構成比（事業所・企業統計調査結果）
    C2103: "C02103", // 第3次産業事業所数構成比（事業所・企業統計調査結果）
    C2104: "C02104", // 第2次産業事業所数構成比
    C2105: "C02105", // 第3次産業事業所数構成比
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の企業活動
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2102,
            }}
            areaCode={areaCode}
            title="第2次産業事業所数構成比（統計調査結果）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2103,
            }}
            areaCode={areaCode}
            title="第3次産業事業所数構成比（統計調査結果）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2104,
            }}
            areaCode={areaCode}
            title="第2次産業事業所数構成比"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2105,
            }}
            areaCode={areaCode}
            title="第3次産業事業所数構成比"
            color="#ef4444"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
