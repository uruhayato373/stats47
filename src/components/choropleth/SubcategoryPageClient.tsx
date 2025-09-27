'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from './CategoryIcon';
import { ChoroplethDataDisplayClient } from './ChoroplethDataDisplayClient';
import { PrefectureDataTableClient } from './PrefectureDataTableClient';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { CategoryData, SubcategoryData, ChoroplethDisplayData, FormattedValue } from '@/types/choropleth';

interface SubcategoryPageClientProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: FormattedValue[] | null;
  currentYear: string;
  isSample: boolean;
  error: string | null;
}

export const SubcategoryPageClient: React.FC<SubcategoryPageClientProps> = ({
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

  // 年度変更時のURLパラメータ更新
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('year', year);
    router.push(`/${category.id}/${subcategory.id}?${newSearchParams.toString()}`);
  };

  // 利用可能年度を生成（サンプル実装）
  const getAvailableYears = (): string[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  };

  const availableYears = getAvailableYears();

  return (
    <>
      <Header />
      <Sidebar />

      {/* メインコンテンツエリア */}
      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {/* ページヘッダー */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div className="flex items-center gap-4">
              {/* カテゴリアイコン */}
              <div className="flex-shrink-0">
                <CategoryIcon iconName={category.icon} className="w-6 h-6 text-indigo-600" />
              </div>

              <div>
                {/* パンくずナビ */}
                <nav className="flex items-center space-x-2 text-xs text-gray-500 dark:text-neutral-400 mb-1">
                  <span>統計データ</span>
                  <span>/</span>
                  <span>{category.name}</span>
                </nav>

                {/* タイトル */}
                <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                  {subcategory.name}
                </h1>
              </div>
            </div>

            {/* 年度セレクターと詳細情報 */}
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded">
                  <span className="text-gray-600 dark:text-neutral-400">単位:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{subcategory.unit}</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded">
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

              {/* 年度セレクター */}
              <div className="flex items-center gap-2">
                <label htmlFor="year-select" className="text-sm text-gray-600 dark:text-neutral-400">
                  年度:
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
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

          {/* メインコンテンツ */}
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
        </div>
      </main>
    </>
  );
};