'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface JobSeekingPlacementPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const JobSeekingPlacementPage: React.FC<JobSeekingPlacementPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010106';
  const statsDataIdRatio = '0000010106';
  const cdCat01 = {
    F1107: 'F1107',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1107,
            }}
            areaCode="00000"
            title="全国完全失業者数"
            color="#4f46e5"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.F1107,
        }}
        subcategory={{
          ...subcategory,
          unit: '人',
          name: '完全失業者数',
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
