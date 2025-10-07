'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface EducationSportsCardPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const EducationSportsCardPage: React.FC<EducationSportsCardPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010105';
  const statsDataIdRatio = '0000010105';
  const cdCat01 = {
    E2101: 'E2101',
    E2301: 'E2301',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E2101,
            }}
            areaCode="00000"
            title="全国小学校数"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.E2301,
            }}
            areaCode="00000"
            title="全国小学校学級数"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.E2101,
        }}
        subcategory={{
          ...subcategory,
          unit: '校',
          name: '小学校数',
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
