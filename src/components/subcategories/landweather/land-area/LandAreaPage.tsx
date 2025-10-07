'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface LandAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandAreaPage: React.FC<LandAreaPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010102';
  const cdCat01 = {
    totalArea: 'B1101', // 総面積
    habitableArea: 'B1103', // 可住地面積
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalArea,
            }}
            areaCode="00000"
            title="全国総面積"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.habitableArea,
            }}
            areaCode="00000"
            title="全国可住地面積"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキング */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.habitableArea,
        }}
        subcategory={{
          ...subcategory,
          unit: 'ha',
          name: '可住地面積',
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
