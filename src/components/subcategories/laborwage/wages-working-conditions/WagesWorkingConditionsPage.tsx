"use client";

import React from "react";
import { StatisticsMetricCard } from "@/components/dashboard/StatisticsMetricCard";
import { SubcategoryLayout } from "@/components/subcategories/SubcategoryLayout";
import { EstatRanking } from "@/components/ranking";
import { SubcategoryPageProps } from "@/types/subcategory";

export const WagesWorkingConditionsPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = "0000010103";
  const cdCat01 = {
    C1202: "C1202",
    C122201: "C122201",
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C1202,
            }}
            areaCode="00000"
            title="全国雇用者報酬"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C122201,
            }}
            areaCode="00000"
            title="全国賃金・俸給"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
