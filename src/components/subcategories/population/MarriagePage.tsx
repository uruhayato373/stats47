"use client";

import React, { useState, useCallback } from "react";
import { SubcategoryLayout } from "../SubcategoryLayout";
import { EstatChoroplethMap } from "@/components/dashboard/ChoroplethMap";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { StatisticsSummary } from "@/components/common/DataTable";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface MarriagePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const MarriagePage: React.FC<MarriagePageProps> = ({
  category,
  subcategory,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);

  // 統計表IDとカテゴリコード
  const statsDataId = "0000010101";
  const cdCat01 = {
    marriages: "A9101", // 婚姻件数
    divorces: "A9201", // 離婚件数
  };

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback((values: FormattedValue[]) => {
    console.log("[MarriagePage] Data loaded:", values.length);
    setFormattedValues(values);
  }, []);

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback((error: Error) => {
    console.error("[MarriagePage] Map error:", error);
  }, []);

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 婚姻件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.marriages,
            }}
            areaCode="00000"
            title="全国婚姻件数"
            unit="組"
            color="#9333ea"
          />

          {/* 離婚件数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.divorces,
            }}
            areaCode="00000"
            title="全国離婚件数"
            unit="組"
            color="#f97316"
          />
        </div>
        <StatisticsSummary data={formattedValues} unit={subcategory.unit} />
      </div>

      {/* メインコンテンツ：3カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-full">
            <EstatChoroplethMap
              params={{
                statsDataId: statsDataId,
                cdCat01: cdCat01.marriages,
              }}
              options={{
                colorScheme: subcategory.colorScheme || "interpolatePurples",
                divergingMidpoint: "zero",
              }}
              width={800}
              height={600}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
