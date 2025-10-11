'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRankingServer } from '@/components/ranking';

interface ConsumerPriceDifferenceIndexPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ConsumerPriceDifferenceIndexPage: React.FC<ConsumerPriceDifferenceIndexPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010103';
  const statsDataIdRatio = '0000010103';
  const cdCat01 = {
    C5106: 'C5106',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C5106,
            }}
            areaCode="00000"
            title="全国消費者物価指数"
            color="#4f46e5"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
