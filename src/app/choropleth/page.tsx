"use client";

import React from "react";
import { ExternalLink, Map } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ChoroplethContainer, ChoroplethInstructions } from "@/components/choropleth";

export default function ChoroplethPage() {

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700 max-w-full overflow-hidden">
          {/* ヘッダーセクション */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <Map className="w-6 h-6 text-indigo-600" />
                e-STAT コロプレス地図
              </h1>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                e-Stat APIから取得した統計データを都道府県別にコロプレス地図で可視化します
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-x-2">
              <a
                href="https://www.e-stat.go.jp/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                e-STAT API
              </a>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="p-4 bg-white dark:bg-neutral-900">
            {/* メインコンテナ */}
            <ChoroplethContainer />

            {/* 使用方法の説明 */}
            <div className="max-w-7xl mx-auto mt-6">
              <ChoroplethInstructions />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

