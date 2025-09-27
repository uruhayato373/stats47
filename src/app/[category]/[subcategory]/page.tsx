'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAtom } from 'jotai';
import { notFound } from 'next/navigation';
import { getSubcategoryById } from '@/lib/choropleth/categories';
import { setSubcategoryAtom, selectedSubcategoryDataAtom } from '@/atoms/choropleth';
import { ChoroplethDataDisplay } from '@/components/choropleth/ChoroplethDataDisplay';
import { YearSelector } from '@/components/choropleth/YearSelector';
import { CategoryIcon } from '@/components/choropleth/CategoryIcon';
import { PrefectureDataTable } from '@/components/choropleth/PrefectureDataTable';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function SubcategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  const [, setSubcategory] = useAtom(setSubcategoryAtom);
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);

  // カテゴリとサブカテゴリの存在確認
  const subcategoryData = getSubcategoryById(subcategoryId);

  useEffect(() => {
    if (subcategoryData) {
      setSubcategory(subcategoryId);
    }
  }, [subcategoryId, setSubcategory, subcategoryData]);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  const { category, subcategory } = subcategoryData;

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
                  <span>コロプレス地図</span>
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
              </div>

              <YearSelector />
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* 地図表示エリア */}
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 h-full">
                <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  コロプレス地図
                </h2>
                <div className="h-full">
                  <ChoroplethDataDisplay />
                </div>
              </div>
            </div>

            {/* データテーブルエリア */}
            <div className="flex-shrink-0">
              <div className="lg:w-80 h-full border-s border-gray-200 dark:border-neutral-700 p-4">
                <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  都道府県別データ
                </h2>
                <PrefectureDataTable />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}