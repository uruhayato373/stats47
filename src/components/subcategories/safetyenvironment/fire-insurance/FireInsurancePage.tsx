'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface FireInsurancePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const FireInsurancePage: React.FC<FireInsurancePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010111';
  const statsDataIdRatio = '0000010111';
  const cdCat01 = {
    K2101: 'K2101',
    K2110: 'K2110',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K2101,
            }}
            areaCode="00000"
            title="全国出火件数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K2110,
            }}
            areaCode="00000"
            title="全国火災死亡者数"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
