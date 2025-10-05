'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface LaborForceStructurePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LaborForceStructurePage: React.FC<LaborForceStructurePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010106';
  const statsDataIdRatio = '0000010106';
  const cdCat01 = {
    F1101: 'F1101',
    F1102: 'F1102',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1101,
            }}
            areaCode="00000"
            title="全国労働力人口"
            unit="人"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.F1102,
            }}
            areaCode="00000"
            title="全国就業者数"
            unit="人"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.F1102,
        }}
        subcategory={{
          ...subcategory,
          unit: '人',
          name: '就業者数',
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
