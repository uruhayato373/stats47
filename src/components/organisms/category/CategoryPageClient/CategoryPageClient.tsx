"use client";

import React from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";

interface SubcategoryItem {
  id: string;
  name: string;
  href: string;
}

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories?: SubcategoryItem[];
  };
}

// カラーマッピング
const colorClassMap: Record<
  string,
  { bg: string; bgDark: string; text: string; textDark: string }
> = {
  teal: {
    bg: "bg-teal-100",
    bgDark: "dark:bg-teal-900/30",
    text: "text-teal-600",
    textDark: "dark:text-teal-400",
  },
  blue: {
    bg: "bg-blue-100",
    bgDark: "dark:bg-blue-900/30",
    text: "text-blue-600",
    textDark: "dark:text-blue-400",
  },
  yellow: {
    bg: "bg-yellow-100",
    bgDark: "dark:bg-yellow-900/30",
    text: "text-yellow-600",
    textDark: "dark:text-yellow-400",
  },
  green: {
    bg: "bg-green-100",
    bgDark: "dark:bg-green-900/30",
    text: "text-green-600",
    textDark: "dark:text-green-400",
  },
  gray: {
    bg: "bg-gray-100",
    bgDark: "dark:bg-gray-900/30",
    text: "text-gray-600",
    textDark: "dark:text-gray-400",
  },
  purple: {
    bg: "bg-purple-100",
    bgDark: "dark:bg-purple-900/30",
    text: "text-purple-600",
    textDark: "dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-100",
    bgDark: "dark:bg-orange-900/30",
    text: "text-orange-600",
    textDark: "dark:text-orange-400",
  },
  indigo: {
    bg: "bg-indigo-100",
    bgDark: "dark:bg-indigo-900/30",
    text: "text-indigo-600",
    textDark: "dark:text-indigo-400",
  },
  red: {
    bg: "bg-red-100",
    bgDark: "dark:bg-red-900/30",
    text: "text-red-600",
    textDark: "dark:text-red-400",
  },
  pink: {
    bg: "bg-pink-100",
    bgDark: "dark:bg-pink-900/30",
    text: "text-pink-600",
    textDark: "dark:text-pink-400",
  },
};

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
  category,
}) => {
  const colorClasses = colorClassMap[category.color] || colorClassMap.gray;

  return (
    <>
      {/* メインコンテンツエリア */}
      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          {/* ページヘッダー */}
          <div className="py-4 px-6 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div className="flex items-center gap-4">
              {/* カテゴリアイコン */}
              <div className="flex-shrink-0">
                <CategoryIcon
                  iconName={category.icon}
                  className="w-8 h-8 text-indigo-600"
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

          {/* サブカテゴリー一覧 */}
          <div className="flex-1 p-6 overflow-auto">
            {category.subcategories && category.subcategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.subcategories.map((subcategory) => (
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
            ) : (
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
            )}
          </div>
        </div>
      </main>
    </>
  );
};
