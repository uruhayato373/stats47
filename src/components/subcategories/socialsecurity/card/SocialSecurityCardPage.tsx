'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/ranking';

interface SocialSecurityCardPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const SocialSecurityCardPage: React.FC<SocialSecurityCardPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010109';
  const statsDataIdRatio = '0000010109';
  const cdCat01 = {
    I1101: 'I1101',
    I1102: 'I1102',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1101,
            }}
            areaCode="00000"
            title="全国男性平均余命"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.I1102,
            }}
            areaCode="00000"
            title="全国女性平均余命"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
