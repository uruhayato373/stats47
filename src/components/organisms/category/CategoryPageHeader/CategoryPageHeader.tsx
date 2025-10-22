/**
 * カテゴリページヘッダーコンポーネント
 *
 * カテゴリページのヘッダー部分（パンくずナビ、タイトル、アイコン）を表示
 */

import React from "react";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";

interface CategoryPageHeaderProps {
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

export const CategoryPageHeader: React.FC<CategoryPageHeaderProps> = ({
  category,
}) => {
  return (
    <div className="py-4 px-6 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="flex items-center gap-4">
        {/* カテゴリアイコン */}
        <div className="flex-shrink-0">
          <CategoryIcon
            iconName={category.icon}
            className="w-8 h-8 text-primary"
          />
        </div>

        <div>
          {/* パンくずナビ */}
          <nav className="flex items-center space-x-2 text-xs text-gray-500 dark:text-neutral-400 mb-1">
            <span>統計データ</span>
            <span>/</span>
            <span>{category.name}</span>
          </nav>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {category.name}
          </h1>
        </div>
      </div>
    </div>
  );
};
