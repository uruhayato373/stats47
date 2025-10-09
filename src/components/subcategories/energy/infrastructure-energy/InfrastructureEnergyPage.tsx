'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface InfrastructureEnergyPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const InfrastructureEnergyPage: React.FC<InfrastructureEnergyPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010111';
  const statsDataIdRatio = '0000010208';
  const cdCat01 = {
    K6107: 'K6107',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.K6107,
            }}
            areaCode="00000"
            title="全国温室効果ガス排出量"
            color="#4f46e5"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.K6107,
        }}
        subcategory={{
          ...subcategory,
          unit: 'tCO2',
          name: '温室効果ガス排出量',
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
