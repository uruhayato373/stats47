'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface FiscalIndicatorsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const FiscalIndicatorsPage: React.FC<FiscalIndicatorsPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010104';
  const statsDataIdRatio = '0000010104';
  const cdCat01 = {
    D2101: 'D2101',
    D2103: 'D2103',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D2101,
            }}
            areaCode="00000"
            title="全国財政力指数"
            unit="-"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.D2103,
            }}
            areaCode="00000"
            title="全国経常収支比率"
            unit="%"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.D2101,
        }}
        subcategory={{
          ...subcategory,
          unit: '-',
          name: '財政力指数',
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
