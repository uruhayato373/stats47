"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { HousingStatisticsRanking } from "./HousingStatisticsRanking";

interface HousingStatisticsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const HousingStatisticsPage: React.FC<HousingStatisticsPageProps> = ({
  category,
  subcategory,
}) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1100,
            }}
            areaCode="00000"
            title="全国総住宅数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1101,
            }}
            areaCode="00000"
            title="全国居住世帯あり住宅数"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1102,
            }}
            areaCode="00000"
            title="全国居住世帯なし住宅数"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H110202,
            }}
            areaCode="00000"
            title="全国空き家数"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1201,
            }}
            areaCode="00000"
            title="全国専用住宅数"
            color="#3b82f6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1203,
            }}
            areaCode="00000"
            title="全国店舗その他の併用住宅数"
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1310,
            }}
            areaCode="00000"
            title="全国持ち家数"
            color="#ec4899"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1320,
            }}
            areaCode="00000"
            title="全国借家数"
            color="#f97316"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1401,
            }}
            areaCode="00000"
            title="全国一戸建住宅数"
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1402,
            }}
            areaCode="00000"
            title="全国長屋建住宅数"
            color="#84cc16"
          />
        </div>
      </div>

      {/* ランキングセクション */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 px-4">
          ランキング
        </h2>
        <HousingStatisticsRanking subcategory={subcategory} />
      </div>
    </SubcategoryLayout>
  );
};
