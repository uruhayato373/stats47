"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface HealthCareAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
  areaName: string;
  currentYear: string;
}

export const HealthCareAreaPage: React.FC<HealthCareAreaPageProps> = ({
  category,
  subcategory,
  areaCode,
  areaName,
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {areaName}の健康・保健
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210101,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（結核）`}
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210104,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（生活習慣病）`}
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210110,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（保健所実施分）`}
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210112,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（保健所実施分・精神）`}
            color="#3b82f6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210114,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（保健所実施分・生活習慣病）`}
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210115,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（保健所実施分・妊産婦）`}
            color="#ec4899"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I210116,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康診断受診者数（保健所実施分・乳幼児）`}
            color="#f97316"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1101,
            }}
            areaCode={areaCode}
            title={`${areaName}の平均余命（0歳）（男）`}
            color="#06b6d4"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1102,
            }}
            areaCode={areaCode}
            title={`${areaName}の平均余命（0歳）（女）`}
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1601,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康寿命（男）`}
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1602,
            }}
            areaCode={areaCode}
            title={`${areaName}の健康寿命（女）`}
            color="#ec4899"
          />
        </div>
      </div>
    </SubcategoryLayout>
  );
};
