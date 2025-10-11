'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRankingServer } from '@/components/ranking';

interface ConstructionManufacturingPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const ConstructionManufacturingPage: React.FC<ConstructionManufacturingPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010103';
  const statsDataIdRatio = '0000010103';
  const cdCat01 = {
    C112207: 'C112207',
    C210708: 'C210708',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C112207,
            }}
            areaCode="00000"
            title="全国建設業GDP"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C210708,
            }}
            areaCode="00000"
            title="全国建設業事業所数"
            color="#10b981"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
