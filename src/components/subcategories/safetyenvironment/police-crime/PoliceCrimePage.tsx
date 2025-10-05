'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface PoliceCrimePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const PoliceCrimePage: React.FC<PoliceCrimePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010111';
  const statsDataIdRatio = '0000010111';
  const cdCat01 = {
    K3101: 'K3101',
    K3102: 'K3102',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K3101,
            }}
            areaCode="00000"
            title="全国交通事故発生件数"
            unit="件"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K3102,
            }}
            areaCode="00000"
            title="全国交通事故死傷者数"
            unit="人"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.K3101,
        }}
        subcategory={{
          ...subcategory,
          unit: '件',
          name: '交通事故発生件数',
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
