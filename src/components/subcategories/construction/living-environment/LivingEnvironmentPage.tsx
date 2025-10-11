'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface LivingEnvironmentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LivingEnvironmentPage: React.FC<LivingEnvironmentPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010108';
  const statsDataIdRatio = '0000010208';
  const cdCat01 = {
    H530101: 'H530101',
    ratio_H0520101: '#H0520101',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H530101,
            }}
            areaCode="00000"
            title="全国上水道給水人口"
            color="#4f46e5"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
