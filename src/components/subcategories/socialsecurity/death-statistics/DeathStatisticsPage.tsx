'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface DeathStatisticsPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const DeathStatisticsPage: React.FC<DeathStatisticsPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010110';
  const statsDataIdRatio = '0000010110';
  const cdCat01 = {
    J1105: 'J1105',
    J1200: 'J1200',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J1105,
            }}
            areaCode="00000"
            title="全国生活保護被保護実人員"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.J1200,
            }}
            areaCode="00000"
            title="全国身体障害者手帳交付数"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
