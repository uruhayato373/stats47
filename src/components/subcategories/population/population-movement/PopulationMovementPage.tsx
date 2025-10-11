"use client";

import React from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/ranking";
import { EstatMultiLineChart } from "@/components/dashboard/MultiLineChart";
import { SubcategoryPageProps } from "@/types/subcategory";

export const PopulationMovementPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    moversIn: "A5103", // 転入者数
    moversOut: "A5104", // 転出者数
    socialIncrease: "A5302", // 社会増減数
    dayTimePopulationRatio: "A6108", // 昼夜間人口比率
    dayTimePopulation: "A6107", // 昼間人口
    inflowPopulationInPref: "A6105", // 流入人口（県内他市区町村）
    inflowPopulationOtherPref: "A6106", // 流入人口（他県）
    outflowPopulationInPref: "A6103", // 流出人口（県内他市区町村）
    outflowPopulationOtherPref: "A6104", // 流出人口（他県）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 転入者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversIn,
            }}
            areaCode="00000"
            title="全国転入者数"
            color="#3b82f6"
          />

          {/* 転出者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversOut,
            }}
            areaCode="00000"
            title="全国転出者数"
            color="#ef4444"
          />

          {/* 社会増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.socialIncrease,
            }}
            areaCode="00000"
            title="全国社会増減数"
            color="#10b981"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayTimePopulationRatio,
            }}
            areaCode="00000"
            title="全国昼夜間人口比率"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 転入・転出の推移 */}
      <div className="px-4 pb-4">
        <EstatMultiLineChart
          params={{
            statsDataId: statsDataId,
            limit: 100000,
          }}
          series={[
            {
              categoryCode: cdCat01.moversIn,
              label: "転入者数",
              color: "#3b82f6",
            },
            {
              categoryCode: cdCat01.moversOut,
              label: "転出者数",
              color: "#ef4444",
            },
            {
              categoryCode: cdCat01.socialIncrease,
              label: "社会増減数",
              color: "#10b981",
            },
          ]}
          areaCode="00000"
          width={800}
          height={400}
          yLabel="人"
          title="転入・転出・社会増減の推移（全国）"
        />
      </div>

      {/* コロプレス地図とデータテーブル */}
      

      {/* 昼間人口と流入出人口の推移 */}
      <div className="px-4 pb-4">
        <EstatMultiLineChart
          params={{
            statsDataId: statsDataId,
            limit: 100000,
          }}
          series={[
            {
              categoryCode: cdCat01.dayTimePopulation,
              label: "昼間人口",
              color: "#8b5cf6",
            },
            {
              categoryCode: cdCat01.inflowPopulationInPref,
              label: "流入人口（県内）",
              color: "#3b82f6",
            },
            {
              categoryCode: cdCat01.inflowPopulationOtherPref,
              label: "流入人口（他県）",
              color: "#06b6d4",
            },
            {
              categoryCode: cdCat01.outflowPopulationInPref,
              label: "流出人口（県内）",
              color: "#f59e0b",
            },
            {
              categoryCode: cdCat01.outflowPopulationOtherPref,
              label: "流出人口（他県）",
              color: "#ef4444",
            },
          ]}
          areaCode="00000"
          width={800}
          height={400}
          yLabel="人"
          title="昼間人口と流入出人口の推移（全国）"
        />
      </div>
    </SubcategoryLayout>
  );
};
