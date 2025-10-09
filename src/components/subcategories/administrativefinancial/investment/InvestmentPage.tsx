'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface InvestmentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const InvestmentPage: React.FC<InvestmentPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010104';
  const statsDataIdRatio = '0000010104';
  const cdCat01 = {
    D4201: 'D4201',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D4201,
            }}
            areaCode="00000"
            title="全国住民税"
            color="#4f46e5"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.D4201,
        }}
        subcategory={{
          ...subcategory,
          unit: '千円',
          name: '住民税',
        }}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateBlues',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
