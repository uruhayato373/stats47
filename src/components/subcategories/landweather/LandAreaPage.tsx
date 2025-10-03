'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubcategoryLayout } from '../SubcategoryLayout';
import { ChoroplethDataDisplayClient } from '@/components/choropleth/ChoroplethDataDisplayClient';
import { PrefectureDataTableClient } from '@/components/choropleth/PrefectureDataTableClient';
import { useSubcategoryData } from '@/hooks/useSubcategoryData';
import { CategoryData, SubcategoryData } from '@/types/choropleth';

interface LandAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

export const LandAreaPage: React.FC<LandAreaPageProps> = ({
  category,
  subcategory,
  currentYear,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // データ取得
  const {
    choroplethData,
    formattedValues,
    loading,
    error,
    isSample,
  } = useSubcategoryData({
    subcategory,
    year: selectedYear,
  });

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('year', year);
    router.push(`/${category.id}/${subcategory.id}?${newSearchParams.toString()}`);
  };

  const getAvailableYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  };

  const availableYears = getAvailableYears();

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* サブヘッダー：年度選択と詳細情報 */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700">
              <span className="text-gray-600 dark:text-neutral-400">単位:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subcategory.unit}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700">
              <span className="text-gray-600 dark:text-neutral-400">種別:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subcategory.dataType === 'numerical' ? '数値' :
                 subcategory.dataType === 'percentage' ? '割合' : '率'}
              </span>
            </div>

            {isSample && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                <span className="text-yellow-800 dark:text-yellow-200 text-xs font-medium">
                  サンプルデータ
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="year-select" className="text-sm text-gray-600 dark:text-neutral-400">
              年度:
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ローディング表示 */}
      {loading && (
        <div className="mx-4 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">データを読み込み中...</p>
        </div>
      )}

      {/* エラー表示 */}
      {error && !loading && (
        <div className="mx-4 mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* メインコンテンツ：2カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
            <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              コロプレス地図
            </h2>
            <div className="h-full">
              <ChoroplethDataDisplayClient
                data={choroplethData}
                formattedValues={formattedValues}
                subcategory={subcategory}
                year={selectedYear}
              />
            </div>
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <div className="lg:w-80 h-full border-s border-gray-200 dark:border-neutral-700 p-4">
            <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              都道府県別データ
            </h2>
            <PrefectureDataTableClient
              data={formattedValues}
              subcategory={subcategory}
            />
          </div>
        </div>
      </div>
    </SubcategoryLayout>
  );
};