"use client";

import React, { useState, useCallback } from "react";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { EstatMultiLineChart } from "@/components/dashboard/MultiLineChart";
import { FormattedValue } from "@/lib/estat/types/formatted";
import { SubcategoryAreaPageProps } from "@/types/subcategory";

export const PopulationMovementAreaPage: React.FC<SubcategoryAreaPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  const [formattedValues, setFormattedValues] = useState<FormattedValue[]>([]);
  const [areaName, setAreaName] = useState<string>("");

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

  // データ読み込み完了時のコールバック（メモ化して無限ループ防止）
  const handleDataLoaded = useCallback((values: FormattedValue[]) => {
    console.log("[PopulationMovementAreaPage] Data loaded:", values.length);
    setFormattedValues(values);

    // 最初のデータから地域名を取得
    if (values.length > 0) {
      setAreaName(values[0].areaName);
    }
  }, []);

  // エラーコールバック（メモ化して無限ループ防止）
  const handleError = useCallback((error: Error) => {
    console.error("[PopulationMovementAreaPage] Error:", error);
  }, []);

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* ヘッダー */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {areaName || "読み込み中..."}の人口移動
        </h1>
      </div>

      {/* 統計カード */}
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 転入者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversIn,
            }}
            areaCode={areaCode}
            title={`${areaName}転入者数`}
            unit="人"
            color="#3b82f6"
          />

          {/* 転出者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.moversOut,
            }}
            areaCode={areaCode}
            title={`${areaName}転出者数`}
            unit="人"
            color="#ef4444"
          />

          {/* 社会増減数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.socialIncrease,
            }}
            areaCode={areaCode}
            title={`${areaName}社会増減数`}
            unit="人"
            color="#10b981"
          />

          {/* 昼夜間人口比率 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.dayTimePopulationRatio,
            }}
            areaCode={areaCode}
            title={`${areaName}昼夜間人口比率`}
            unit="%"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* メインコンテンツ：2カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
        {/* 転入・転出の推移 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              転入・転出・社会増減の推移
            </h2>
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
              areaCode={areaCode}
              width={800}
              height={400}
              yLabel="人"
              title={`転入・転出・社会増減の推移（${areaName}）`}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
            />
          </div>
        </div>
      </div>

      {/* 昼間人口と流入出人口の推移 */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            昼間人口と流入出人口の推移
          </h2>
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
            areaCode={areaCode}
            width={800}
            height={400}
            yLabel="人"
            title={`昼間人口と流入出人口の推移（${areaName}）`}
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
