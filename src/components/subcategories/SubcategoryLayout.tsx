'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { CategoryIcon } from '@/components/choropleth/CategoryIcon';
import { SubcategoryNavigation } from './SubcategoryNavigation';
import { CategoryData, SubcategoryData } from '@/types/choropleth';

interface SubcategoryLayoutProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  children: React.ReactNode;
}

export const SubcategoryLayout: React.FC<SubcategoryLayoutProps> = ({
  category,
  subcategory,
  children,
}) => {
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
          </div>

          {/* サブカテゴリナビゲーション */}
          <SubcategoryNavigation category={category} currentSubcategory={subcategory} />

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};