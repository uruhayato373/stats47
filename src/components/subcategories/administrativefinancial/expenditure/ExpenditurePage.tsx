'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface ExpenditurePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ExpenditurePage: React.FC<ExpenditurePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010104';
  const statsDataIdRatio = '0000010104';
  const cdCat01 = {
    D3103: 'D3103',
    D310303: 'D310303',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D3103,
            }}
            areaCode="00000"
            title="全国歳出決算総額"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D310303,
            }}
            areaCode="00000"
            title="全国民生費"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
