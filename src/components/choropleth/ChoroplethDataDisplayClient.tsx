'use client';

import React from 'react';
import { ChoroplethDisplayData, SubcategoryData } from '@/types/choropleth';

interface ChoroplethDataDisplayClientProps {
  data: ChoroplethDisplayData | null;
  subcategory: SubcategoryData;
  year: string;
  className?: string;
}

export const ChoroplethDataDisplayClient: React.FC<ChoroplethDataDisplayClientProps> = ({
  data,
  subcategory,
  year,
  className = ''
}) => {
  // データが存在しない場合の表示
  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-neutral-400 text-sm">
            データを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {/* 地図表示エリア */}
      <div className="relative w-full h-full bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
        {/* ヘッダー情報 */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {subcategory.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-neutral-400">
              {year}年 | 単位: {subcategory.unit}
            </div>
          </div>
        </div>

        {/* 凡例 */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">
              値の範囲
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 dark:text-neutral-400">低</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className="w-4 h-3 rounded-sm"
                    style={{
                      backgroundColor: getColorForLevel(level, subcategory.colorScheme || 'interpolateBlues')
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600 dark:text-neutral-400">高</span>
            </div>
          </div>
        </div>

        {/* 地図表示（プレースホルダー） */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              日本地図コンポーネント
            </p>
            <p className="text-gray-500 dark:text-neutral-500 text-xs mt-1">
              {data.dataPoints.length}件のデータ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// カラースキームに基づく色生成（簡易版）
function getColorForLevel(level: number, colorScheme: string): string {
  const intensity = level / 5; // 0.2, 0.4, 0.6, 0.8, 1.0

  // D3のカラースキームに対応
  switch (colorScheme) {
    case 'interpolateBlues':
      return `hsl(210, 100%, ${100 - intensity * 40}%)`;
    case 'interpolateGreens':
      return `hsl(120, 80%, ${100 - intensity * 40}%)`;
    case 'interpolateOranges':
      return `hsl(25, 100%, ${100 - intensity * 30}%)`;
    case 'interpolateReds':
      return `hsl(0, 100%, ${100 - intensity * 40}%)`;
    default:
      return `hsl(210, 100%, ${100 - intensity * 40}%)`;
  }
}