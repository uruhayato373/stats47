'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface NaturalEnvironmentPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const NaturalEnvironmentPage: React.FC<NaturalEnvironmentPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010102';
  const statsDataIdRatio = '0000010202';
  const cdCat01 = {
    forestArea: 'B1106', // 森林面積
    forestRatio: '#B01202', // 森林面積割合
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.forestArea,
            }}
            areaCode="00000"
            title="全国森林面積"
            unit="ha"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataIdRatio,
              cdCat01: cdCat01.forestRatio,
            }}
            areaCode="00000"
            title="全国森林面積割合"
            unit="%"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキング */}
      <EstatRanking
        params={{
          statsDataId: statsDataIdRatio,
          cdCat01: cdCat01.forestRatio,
        }}
        subcategory={{
          ...subcategory,
          unit: '%',
          name: '森林面積割合',
        }}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateGreens',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
