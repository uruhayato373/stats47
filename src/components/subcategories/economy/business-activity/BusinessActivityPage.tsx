"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface BusinessActivityPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BusinessActivityPage: React.FC<BusinessActivityPageProps> = ({
  category,
  subcategory,
}) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2102,
            }}
            areaCode="00000"
            title="第2次産業事業所数構成比（統計調査結果）"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2103,
            }}
            areaCode="00000"
            title="第3次産業事業所数構成比（統計調査結果）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2104,
            }}
            areaCode="00000"
            title="第2次産業事業所数構成比"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C2105,
            }}
            areaCode="00000"
            title="第3次産業事業所数構成比"
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
