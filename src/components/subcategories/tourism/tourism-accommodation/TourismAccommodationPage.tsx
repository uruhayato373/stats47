'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface TourismAccommodationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const TourismAccommodationPage: React.FC<TourismAccommodationPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010107';
  const statsDataIdRatio = '0000010107';
  const cdCat01 = {
    G7101: 'G7101',
    G7102: 'G7102',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G7101,
            }}
            areaCode="00000"
            title="全国延べ宿泊者数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.G7102,
            }}
            areaCode="00000"
            title="全国外国人延べ宿泊者数"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.G7102,
        }}
        subcategory={{
          ...subcategory,
          unit: '人泊',
          name: '外国人延べ宿泊者数',
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
