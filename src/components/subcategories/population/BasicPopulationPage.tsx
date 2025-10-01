'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SubcategoryLayout } from '../SubcategoryLayout';
import { ChoroplethDataDisplayClient } from '@/components/choropleth/ChoroplethDataDisplayClient';
import { PrefectureDataTableClient } from '@/components/choropleth/PrefectureDataTableClient';
import { CategoryData, SubcategoryData, ChoroplethDisplayData } from '@/types/choropleth';

interface BasicPopulationPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: any[] | null;
  currentYear: string;
  isSample: boolean;
  error: string | null;
}

export const BasicPopulationPage: React.FC<BasicPopulationPageProps> = ({
  category,
  subcategory,
  choroplethData,
  formattedValues,
  currentYear,
  isSample,
  error,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  // 統計サマリーの計算
  const calculateSummary = () => {
    if (!formattedValues || formattedValues.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 };
    }

    const values = formattedValues.map((v: any) => v.value).filter((v: number) => !isNaN(v));
    const total = values.reduce((sum: number, v: number) => sum + v, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  };

  const summary = calculateSummary();

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      {/* サブヘッダー */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700">
              <span className="text-gray-600 dark:text-neutral-400">単位:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subcategory.unit}</span>
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

      {/* エラー表示 */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* 統計サマリーカード */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">合計</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">{subcategory.unit}</div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">平均</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">{subcategory.unit}</div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">最大</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.max.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">{subcategory.unit}</div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">最小</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.min.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-neutral-500 mt-1">{subcategory.unit}</div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ：2カラムレイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4">
        {/* 地図表示エリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
            <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              コロプレス地図
            </h2>
            <div className="h-full">
              <ChoroplethDataDisplayClient
                data={choroplethData}
                subcategory={subcategory}
                year={selectedYear}
              />
            </div>
          </div>
        </div>

        {/* データテーブルエリア */}
        <div className="flex-shrink-0">
          <div className="lg:w-80 h-full lg:border-s border-gray-200 dark:border-neutral-700 lg:ps-4">
            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
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
      </div>
    </SubcategoryLayout>
  );
};