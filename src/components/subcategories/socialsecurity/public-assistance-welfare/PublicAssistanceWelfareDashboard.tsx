"use client";

import React from "react";

import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { SubcategoryDashboardPageProps } from "@/types/subcategory";

export const PublicAssistanceWelfareDashboard: React.FC<
  SubcategoryDashboardPageProps
> = ({ category, subcategory, areaCode }) => {
  const statsDataId = "0000010152";
  const cdCat01 = {
    recipients: "YY1101", // 生活保護受給者数
    households: "YY1102", // 生活保護世帯数
    welfareFacilities: "YY1103", // 福祉施設数
  };

  const isNational = areaCode === "00000";

  return (
    <SubcategoryLayout
      category={category}
      subcategory={subcategory}
      viewType="dashboard"
      areaCode={areaCode}
    >
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 生活保護受給者数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.recipients,
            }}
            areaCode={areaCode}
            title={isNational ? "全国生活保護受給者数" : "生活保護受給者数"}
            color="#ec4899"
          />

          {/* 生活保護世帯数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.households,
            }}
            areaCode={areaCode}
            title={isNational ? "全国生活保護世帯数" : "生活保護世帯数"}
            color="#db2777"
          />

          {/* 福祉施設数 */}
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.welfareFacilities,
            }}
            areaCode={areaCode}
            title={isNational ? "全国福祉施設数" : "福祉施設数"}
            color="#be185d"
          />
        </div>
      </div>

      {/* 生活保護・福祉の詳細分析（全国の場合のみ） */}
      {isNational && (
        <div className="px-4 pb-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              全国生活保護・福祉の詳細分析
            </h2>
            {/* 生活保護・福祉の詳細分析コンポーネントをここに追加 */}
            <div className="text-gray-500 dark:text-neutral-400 text-center py-8">
              生活保護・福祉詳細分析コンポーネント（実装予定）
            </div>
          </div>
        </div>
      )}
    </SubcategoryLayout>
  );
};
