'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRankingServer } from '@/components/ranking';

interface RevenuePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const RevenuePage: React.FC<RevenuePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010104';
  const statsDataIdRatio = '0000010104';
  const cdCat01 = {
    D3101: 'D3101',
    D310101: 'D310101',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D3101,
            }}
            areaCode="00000"
            title="全国歳入決算総額"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D310101,
            }}
            areaCode="00000"
            title="全国地方税"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
