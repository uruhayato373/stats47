'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRankingServer } from '@/components/ranking';

interface WorkerHouseholdIncomePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WorkerHouseholdIncomePage: React.FC<WorkerHouseholdIncomePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010112';
  const statsDataIdRatio = '0000010112';
  const cdCat01 = {
    L3110: 'L3110',
    L3130: 'L3130',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.L3110,
            }}
            areaCode="00000"
            title="全国実収入"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.L3130,
            }}
            areaCode="00000"
            title="全国可処分所得"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
