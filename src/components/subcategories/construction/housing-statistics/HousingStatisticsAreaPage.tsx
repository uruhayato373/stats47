"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface HousingStatisticsAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
  currentYear: string;
}

export const HousingStatisticsAreaPage: React.FC<
  HousingStatisticsAreaPageProps
> = ({ category, subcategory, areaCode, areaName }) => {
  const statsDataId = "0000010108";
  const cdCat01 = {
    H1100: "H1100", // 総住宅数
    H1101: "H1101", // 居住世帯あり住宅数
    H1102: "H1102", // 居住世帯なし住宅数
    H110201: "H110201", // 一時現在者のみ住宅数
    H110202: "H110202", // 空き家数
    H110203: "H110203", // 建築中住宅数
    H1201: "H1201", // 専用住宅数
    H1203: "H1203", // 店舗その他の併用住宅数
    H1310: "H1310", // 持ち家数
    H1320: "H1320", // 借家数
    H1321: "H1321", // 公営・都市再生機構（ＵＲ）・公社の借家数
    H132101: "H132101", // 公営の借家数
    H132102: "H132102", // 都市再生機構（ＵＲ）・公社の借家数
    H1322: "H1322", // 民営借家数
    H1323: "H1323", // 給与住宅数
    H1401: "H1401", // 一戸建住宅数
    H140101: "H140101", // 一戸建住宅数（木造）
    H140102: "H140102", // 一戸建住宅数（非木造）
    H1402: "H1402", // 長屋建住宅数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の住宅統計
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1100,
            }}
            areaCode={areaCode}
            title={`${areaName}の総住宅数`}
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1101,
            }}
            areaCode={areaCode}
            title={`${areaName}の居住世帯あり住宅数`}
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1102,
            }}
            areaCode={areaCode}
            title={`${areaName}の居住世帯なし住宅数`}
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H110202,
            }}
            areaCode={areaCode}
            title={`${areaName}の空き家数`}
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1201,
            }}
            areaCode={areaCode}
            title={`${areaName}の専用住宅数`}
            color="#3b82f6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1203,
            }}
            areaCode={areaCode}
            title={`${areaName}の店舗その他の併用住宅数`}
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1310,
            }}
            areaCode={areaCode}
            title={`${areaName}の持ち家数`}
            color="#ec4899"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1320,
            }}
            areaCode={areaCode}
            title={`${areaName}の借家数`}
            color="#f97316"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1401,
            }}
            areaCode={areaCode}
            title={`${areaName}の一戸建住宅数`}
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1402,
            }}
            areaCode={areaCode}
            title={`${areaName}の長屋建住宅数`}
            color="#84cc16"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
