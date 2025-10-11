'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface HousingFacilitiesPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const HousingFacilitiesPage: React.FC<HousingFacilitiesPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010108';
  const statsDataIdRatio = '0000010108';
  const cdCat01 = {
    H1401: 'H1401',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.H1401,
            }}
            areaCode="00000"
            title="全国一戸建住宅数"
            color="#4f46e5"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
