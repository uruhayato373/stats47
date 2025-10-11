"use client";

import React from "react";
import { CategoryData, SubcategoryData } from "@/types/choropleth";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";

interface PublicAssistanceWelfarePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const PublicAssistanceWelfarePage: React.FC<
  PublicAssistanceWelfarePageProps
> = ({ category, subcategory }) => {
  const statsDataId = "0000010210";
  const cdCat01 = {
    J01101: "#J01101", // 生活保護被保護実世帯数
    J01107: "#J01107", // 生活保護被保護実人員
    J0110803: "#J0110803", // 生活保護教育扶助人員
    J0110804: "#J0110804", // 生活保護医療扶助人員
    J0110805: "#J0110805", // 生活保護住宅扶助人員
    J0110806: "#J0110806", // 生活保護介護扶助人員
    J0110902: "#J0110902", // 生活保護被保護高齢者数
    J01200: "#J01200", // 身体障害者手帳交付数
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J01101,
            }}
            areaCode="00000"
            title="全国生活保護被保護実世帯数（月平均一般世帯千世帯当たり）"
            color="#ef4444"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J01107,
            }}
            areaCode="00000"
            title="全国生活保護被保護実人員（月平均人口千人当たり）"
            color="#f59e0b"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J0110803,
            }}
            areaCode="00000"
            title="全国生活保護教育扶助人員（月平均人口千人当たり）"
            color="#10b981"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J0110804,
            }}
            areaCode="00000"
            title="全国生活保護医療扶助人員（月平均人口千人当たり）"
            color="#3b82f6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J0110805,
            }}
            areaCode="00000"
            title="全国生活保護住宅扶助人員（月平均人口千人当たり）"
            color="#8b5cf6"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J0110806,
            }}
            areaCode="00000"
            title="全国生活保護介護扶助人員（月平均人口千人当たり）"
            color="#ec4899"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J0110902,
            }}
            areaCode="00000"
            title="全国生活保護被保護高齢者数（月平均65歳以上人口千人当たり）"
            color="#f97316"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J01200,
            }}
            areaCode="00000"
            title="全国身体障害者手帳交付数（人口千人当たり）"
            color="#06b6d4"
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
