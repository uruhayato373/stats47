'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface WaterSupplySeweragePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WaterSupplySeweragePage: React.FC<WaterSupplySeweragePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010108';
  const statsDataIdRatio = '0000010208';
  const cdCat01 = {
    H530301: 'H530301',
    ratio_H0530401: '#H0530401',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H530301,
            }}
            areaCode="00000"
            title="全国上水道年間給水量"
            color="#4f46e5"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataIdRatio,
          cdCat01: cdCat01.ratio_H0530401,
        }}
        subcategory={{
          ...subcategory,
          unit: '%',
          name: '下水道普及率',
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
