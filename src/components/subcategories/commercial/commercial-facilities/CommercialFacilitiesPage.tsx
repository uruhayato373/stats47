'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface CommercialFacilitiesPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CommercialFacilitiesPage: React.FC<CommercialFacilitiesPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010103';
  const statsDataIdRatio = '0000010103';
  const cdCat01 = {
    C210715: 'C210715',
    C220715: 'C220715',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C210715,
            }}
            areaCode="00000"
            title="全国小売業事業所数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C220715,
            }}
            areaCode="00000"
            title="全国小売業従業者数"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.C210715,
        }}
        subcategory={{
          ...subcategory,
          unit: '所',
          name: '小売業事業所数',
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
