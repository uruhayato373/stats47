'use client';

import React from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRankingServer } from '@/components/ranking';

interface WasteManagementPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const WasteManagementPage: React.FC<WasteManagementPageProps> = ({
  category,
  subcategory,
}) => {
  const statsDataId = '0000010103';
  const statsDataIdRatio = '0000010103';
  const cdCat01 = {
    C112208: 'C112208',
  };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.C112208,
            }}
            areaCode="00000"
            title="全国廃棄物処理業GDP"
            color="#4f46e5"
          />
        </div>
      </div>

      
    </SubcategoryLayout>
  );
};
