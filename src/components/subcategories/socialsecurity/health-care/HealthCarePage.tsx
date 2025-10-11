"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface HealthCarePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const HealthCarePage: React.FC<HealthCarePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010109";
  const cdCat01 = {
    I210101: "I210101", // 健康診断受診者数（結核）
    I210104: "I210104", // 健康診断受診者数（生活習慣病）
    I210110: "I210110", // 健康診断受診者数（保健所実施分）
    I210112: "I210112", // 健康診断受診者数（保健所実施分・精神）
    I210114: "I210114", // 健康診断受診者数（保健所実施分・生活習慣病）
    I210115: "I210115", // 健康診断受診者数（保健所実施分・妊産婦）
    I210116: "I210116", // 健康診断受診者数（保健所実施分・乳幼児）
    I1101: "I1101", // 平均余命（0歳）（男）
    I1102: "I1102", // 平均余命（0歳）（女）
    I1601: "I1601", // 健康寿命（男）
    I1602: "I1602", // 健康寿命（女）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210101,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（結核）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210104,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（生活習慣病）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210110,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（保健所実施分）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210112,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（保健所実施分・精神）"
            color="#3b82f6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210114,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（保健所実施分・生活習慣病）"
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210115,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（保健所実施分・妊産婦）"
            color="#ec4899"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210116,
            }}
            areaCode="00000"
            title="全国健康診断受診者数（保健所実施分・乳幼児）"
            color="#f97316"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1101,
            }}
            areaCode="00000"
            title="全国平均余命（0歳）（男）"
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1102,
            }}
            areaCode="00000"
            title="全国平均余命（0歳）（女）"
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1601,
            }}
            areaCode="00000"
            title="全国健康寿命（男）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1602,
            }}
            areaCode="00000"
            title="全国健康寿命（女）"
            color="#ec4899"
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
