'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface LandUsePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandUsePage: React.FC<LandUsePageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010102';
  const cdCat01 = {
    totalLandArea: 'B1201', // 評価総地積（課税対象土地）
    residentialLand: 'B120103', // 評価総地積（宅地）
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* 統計カード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.totalLandArea,
            }}
            areaCode="00000"
            title="全国評価総地積"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.residentialLand,
            }}
            areaCode="00000"
            title="全国宅地面積"
            color="#10b981"
          />
        </div>
      </div>

      {/* ランキング */}
      <EstatRanking
        params={{
          statsDataId: statsDataId,
          cdCat01: cdCat01.residentialLand,
        }}
        subcategory={{
          ...subcategory,
          unit: 'm²',
          name: '宅地面積',
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
