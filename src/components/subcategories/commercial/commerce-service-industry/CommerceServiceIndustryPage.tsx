'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface CommerceServiceIndustryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const CommerceServiceIndustryPage: React.FC<CommerceServiceIndustryPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010103';
  const statsDataIdRatio = '0000010103';
  const cdCat01 = {
    C112209: 'C112209',
    C210713: 'C210713',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C112209,
            }}
            areaCode="00000"
            title="全国卸売・小売業GDP"
            unit="百万円"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C210713,
            }}
            areaCode="00000"
            title="全国卸売・小売業事業所数"
            unit="所"
            color="#10b981"
          />
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.C112209,
        }}
        subcategory={{
          ...subcategory,
          unit: '百万円',
          name: '卸売・小売業GDP',
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
