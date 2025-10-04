"use client";

import React from "react";
import { SubcategoryLayout } from "../SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatRanking } from "@/components/dashboard/Ranking";
import { EstatMultiLineChart } from "@/components/dashboard/MultiLineChart";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface BirthDeathPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const BirthDeathPage: React.FC<BirthDeathPageProps> = ({
  category,
  subcategory,
}) => {
  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    births: "A4101", // 出生数
    deaths: "A4200", // 死亡数
    naturalIncrease: "A4301", // 自然増減数
    totalFertilityRate: "A4103", // 合計特殊出生率
    naturalIncreaseRate: "A4401", // 自然増減率
    birthRate: "A4102", // 出生率
    deathRate: "A4201", // 死亡率
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 出生数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.births,
            }}
            areaCode="00000"
            title="全国出生数"
            unit="人"
            color="#10b981"
          />

          {/* 死亡数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.deaths,
            }}
            areaCode="00000"
            title="全国死亡数"
            unit="人"
            color="#ef4444"
          />

          {/* 自然増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.naturalIncrease,
            }}
            areaCode="00000"
            title="全国自然増減数"
            unit="人"
            color="#3b82f6"
          />

          {/* 合計特殊出生率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalFertilityRate,
            }}
            areaCode="00000"
            title="全国合計特殊出生率"
            unit=""
            color="#f59e0b"
          />
        </div>
      </div>

      {/* 出生・死亡の推移 */}
      <div className="px-4 pb-4">
        <EstatMultiLineChart
          params={{
            statsDataId: statsDataId,
            limit: 100000,
          }}
          series={[
            {
              categoryCode: cdCat01.births,
              label: "出生数",
              color: "#10b981",
            },
            {
              categoryCode: cdCat01.deaths,
              label: "死亡数",
              color: "#ef4444",
            },
            {
              categoryCode: cdCat01.naturalIncrease,
              label: "自然増減数",
              color: "#3b82f6",
            },
          ]}
          areaCode="00000"
          width={800}
          height={400}
          yLabel="人"
          title="出生・死亡・自然増減の推移（全国）"
        />
      </div>

      {/* コロプレス地図とデータテーブル */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.naturalIncreaseRate,
        }}
        subcategory={subcategory}
        options={{
          colorScheme: subcategory.colorScheme || "interpolateRdYlGn",
          divergingMidpoint: "zero",
        }}
        mapWidth={800}
        mapHeight={600}
      />

      {/* 出生率・死亡率・自然増減率の推移 */}
      <div className="px-4 pb-4">
        <EstatMultiLineChart
          params={{
            statsDataId: statsDataId,
            limit: 100000,
          }}
          series={[
            {
              categoryCode: cdCat01.birthRate,
              label: "出生率",
              color: "#10b981",
            },
            {
              categoryCode: cdCat01.deathRate,
              label: "死亡率",
              color: "#ef4444",
            },
            {
              categoryCode: cdCat01.naturalIncreaseRate,
              label: "自然増減率",
              color: "#3b82f6",
            },
          ]}
          areaCode="00000"
          width={800}
          height={400}
          yLabel="‰"
          title="出生率・死亡率・自然増減率の推移（全国）"
        />
      </div>
    </SubcategoryLayout>
  );
};
