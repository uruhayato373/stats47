'use client';

import React from 'react';
import { SubcategoryLayout } from '@/components/subcategories/SubcategoryLayout';
import { SubcategoryPageProps } from '@/types/subcategory';

/**
 * 賃金・労働条件サブカテゴリページ
 *
 * TODO: このページを実装してください
 * - statsDataIdとカテゴリコードを定義
 * - 統計カード、グラフ、ランキング等のコンポーネントを配置
 * - BasicPopulationPage.tsx を参考にしてください
 */
export const WagesWorkingConditionsPage: React.FC<SubcategoryPageProps> = ({
  category,
  subcategory,
  currentYear,
}) => {
  // TODO: 統計表IDとカテゴリコードを定義
  // const statsDataId = 'XXXXXXXXXX';
  // const cdCat01 = {
  //   averageWage: 'XXXXXX',
  //   workingHours: 'XXXXXX',
  // };

  return (
    <SubcategoryLayout category={category} subcategory={subcategory}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            賃金・労働条件
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            このページは現在開発中です。
          </p>
          <p className="text-sm text-gray-500 dark:text-neutral-500">
            実装方法については BasicPopulationPage.tsx を参考にしてください。
          </p>
        </div>
      </div>
    </SubcategoryLayout>
  );
};
