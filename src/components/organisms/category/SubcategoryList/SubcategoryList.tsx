/**
 * サブカテゴリ一覧コンポーネント
 *
 * サブカテゴリの一覧表示とリンク機能を提供
 */

import React from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";
import { getCategoryColorClasses } from "@/lib/category/color-mapping";

interface SubcategoryItem {
  id: string;
  name: string;
  href: string;
}

interface SubcategoryListProps {
  subcategories: SubcategoryItem[];
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export const SubcategoryList: React.FC<SubcategoryListProps> = ({
  subcategories,
  category,
}) => {
  const colorClasses = getCategoryColorClasses(category.color);

  if (!subcategories || subcategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CategoryIcon
            iconName={category.icon}
            className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-600 mb-4"
          />
          <p className="text-gray-500 dark:text-neutral-400">
            このカテゴリーにはサブカテゴリーがありません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/${category.id}${subcategory.href}`}
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:hover:border-indigo-500"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${colorClasses.bg} ${colorClasses.bgDark} flex items-center justify-center`}
              >
                <CategoryIcon
                  iconName={category.icon}
                  className={`w-5 h-5 ${colorClasses.text} ${colorClasses.textDark}`}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {subcategory.name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
