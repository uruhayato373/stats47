'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { CategorySidebar } from '@/components/choropleth/CategorySidebar';
import { useAtom } from 'jotai';
import {
  selectedCategoryDataAtom,
  selectedSubcategoryDataAtom,
} from '@/atoms/choropleth';
import { CategoryIcon } from '@/components/choropleth/CategoryIcon';

export default function ChoroplethPage() {
  const [selectedCategory] = useAtom(selectedCategoryDataAtom);
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);

  return (
    <>
      <Header />
      <Sidebar />

      {/* メインコンテンツエリア */}
      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">

          {/* カテゴリサイドバー */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-neutral-700">
            <CategorySidebar />
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col">
            {/* ページヘッダー */}
            <div className="py-4 px-6 border-b border-gray-200 dark:border-neutral-700">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                コロプレス地図
              </h1>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                統計データをカテゴリから選択して、都道府県別の地図表示を確認できます
              </p>
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 p-6">
              {!selectedCategory && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      カテゴリを選択してください
                    </h3>
                    <p className="text-gray-600 dark:text-neutral-400">
                      左側のカテゴリリストから統計データのカテゴリを選択してください
                    </p>
                  </div>
                </div>
              )}

              {selectedCategory && !selectedSubcategory && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <CategoryIcon
                        iconName={selectedCategory.icon}
                        className="w-8 h-8 text-indigo-600"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-gray-600 dark:text-neutral-400 mb-4">
                      {selectedCategory.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-neutral-500">
                      サブカテゴリを選択してデータを表示してください
                    </p>
                  </div>
                </div>
              )}

              {selectedCategory && selectedSubcategory && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CategoryIcon
                        iconName={selectedCategory.icon}
                        className="w-8 h-8 text-green-600"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {selectedSubcategory.name}
                    </h3>
                    <p className="text-gray-600 dark:text-neutral-400 mb-4">
                      {selectedSubcategory.description}
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-neutral-500 mb-6">
                      <div>単位: {selectedSubcategory.unit}</div>
                      <div>データ種別: {
                        selectedSubcategory.dataType === 'numerical' ? '数値' :
                        selectedSubcategory.dataType === 'percentage' ? '割合' : '率'
                      }</div>
                    </div>
                    <div className="space-y-3">
                      <a
                        href={`/${selectedCategory.id}/${selectedSubcategory.id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                          />
                        </svg>
                        コロプレス地図を表示
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}