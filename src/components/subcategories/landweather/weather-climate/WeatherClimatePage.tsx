'use client';

import React, { useState } from 'react';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { StatisticsMetricCard } from '@/components/dashboard/StatisticsMetricCard';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { EstatRanking } from '@/components/dashboard/Ranking';

interface WeatherClimatePageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

type RankingTab = 'temperature' | 'precipitation';

export const WeatherClimatePage: React.FC<WeatherClimatePageProps> = ({
  category,
  subcategory,
}) => {
  const [activeTab, setActiveTab] = useState<RankingTab>('temperature');

  const statsDataId = '0000010102';
  const cdCat01 = {
    avgTemperature: 'B4101',
    precipitation: 'B4109',
  };

  const rankings = {
    temperature: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.avgTemperature,
      unit: '℃',
      name: '年平均気温',
    },
    precipitation: {
      statsDataId: statsDataId,
      cdCat01: cdCat01.precipitation,
      unit: 'mm',
      name: '年間降水量',
    },
  };

  const activeRanking = rankings[activeTab];

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.avgTemperature,
            }}
            areaCode="00000"
            title="全国年平均気温"
            color="#4f46e5"
          />
          <StatisticsMetricCard
            params={{
              statsDataId: statsDataId,
              cdCat01: cdCat01.precipitation,
            }}
            areaCode="00000"
            title="全国年間降水量"
            color="#10b981"
          />
        </div>
      </div>

      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('temperature')}
              className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              年平均気温
            </button>
            <button
              onClick={() => setActiveTab('precipitation')}
              className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            >
              年間降水量
            </button>
          </nav>
        </div>
      </div>

      <EstatRanking
        params={{
          statsDataId: activeRanking.statsDataId,
          cdCat01: activeRanking.cdCat01,
        }}
        subcategory={{
          ...subcategory,
          unit: activeRanking.unit,
          name: activeRanking.name,
        }}
        options={{
          colorScheme: subcategory.colorScheme || 'interpolateRdYlBu',
          divergingMidpoint: 'zero',
        }}
        mapWidth={800}
        mapHeight={600}
      />
    </SubcategoryLayout>
  );
};
