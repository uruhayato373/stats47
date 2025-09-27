"use client";

import React from 'react';
import { Provider } from 'jotai';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { CategorySidebar } from '@/components/choropleth/CategorySidebar';
import { YearSelector } from '@/components/choropleth/YearSelector';
import { ChoroplethDataDisplay } from '@/components/choropleth/ChoroplethDataDisplay';

/**
 * コロプレス地図表示ページ
 *
 * e-stat APIから取得した統計データを都道府県別コロプレス地図として表示する機能を提供します。
 * カテゴリ・サブカテゴリ・年度の選択により、様々な統計データを視覚化できます。
 */
export default function ChoroplethMapPage() {
  return (
    <Provider>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen bg-gray-50 dark:bg-neutral-900">
        {/* レイアウトコンテナ */}
        <div className="max-w-7xl mx-auto">
          {/* ページタイトル */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">
              統計データ地図表示
            </h1>
            <p className="text-gray-600 dark:text-neutral-400">
              e-stat APIの統計データを都道府県別コロプレス地図として表示します。
              カテゴリとサブカテゴリを選択して、様々な統計データを視覚的に比較できます。
            </p>
          </div>

          {/* メインコンテンツエリア */}
          <div className="flex flex-col xl:flex-row gap-6">
            {/* 左側: コントロールパネル */}
            <div className="xl:w-80 xl:flex-shrink-0 space-y-6">
              {/* カテゴリ選択サイドバー */}
              <CategorySidebar className="h-auto xl:h-[600px]" />

              {/* 年度選択 */}
              <YearSelector />
            </div>

            {/* 右側: データ表示エリア */}
            <div className="xl:flex-1 min-w-0">
              <ChoroplethDataDisplay />
            </div>
          </div>
        </div>
      </main>
    </Provider>
  );
}