"use client";

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import {
  selectedCategoryAtom,
  selectedSubcategoryAtom,
  setCategoryAtom,
  setSubcategoryAtom,
  categoriesAtom,
  selectedCategoryDataAtom,
  selectedSubcategoryDataAtom
} from '@/atoms/choropleth';
import { CategoryData, SubcategoryData } from '@/types/choropleth';
import { useStyles } from '@/hooks/useStyles';

interface CategorySidebarProps {
  className?: string;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  className = ""
}) => {
  const styles = useStyles();
  const [categories] = useAtom(categoriesAtom);
  const [selectedCategoryId] = useAtom(selectedCategoryAtom);
  const [selectedSubcategoryId] = useAtom(selectedSubcategoryAtom);
  const [selectedCategory] = useAtom(selectedCategoryDataAtom);
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);
  const [, setCategory] = useAtom(setCategoryAtom);
  const [, setSubcategory] = useAtom(setSubcategoryAtom);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (category: CategoryData) => {
    // カテゴリがクリックされたら展開状態をトグル
    toggleCategoryExpansion(category.id);

    // 既に選択されているカテゴリの場合は選択解除、そうでなければ選択
    if (selectedCategoryId === category.id) {
      setCategory(null);
    } else {
      setCategory(category.id);
      // 新しいカテゴリを選択したら展開
      const newExpanded = new Set(expandedCategories);
      newExpanded.add(category.id);
      setExpandedCategories(newExpanded);
    }
  };

  const handleSubcategoryClick = (subcategory: SubcategoryData) => {
    if (selectedSubcategoryId === subcategory.id) {
      setSubcategory(null);
    } else {
      setSubcategory(subcategory.id);
    }
  };

  return (
    <div className={`${styles.card.base} h-full ${className}`}>
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <h2 className={`${styles.heading.md} flex items-center gap-2`}>
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          統計データカテゴリ
        </h2>
        {selectedCategory && selectedSubcategory && (
          <div className="mt-2 text-xs text-gray-600 dark:text-neutral-400">
            <div className="font-medium">{selectedCategory.name}</div>
            <div className="text-indigo-600 dark:text-indigo-400">
              → {selectedSubcategory.name}
            </div>
          </div>
        )}
      </div>

      {/* カテゴリリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const isSelected = selectedCategoryId === category.id;

            return (
              <div key={category.id} className="mb-1">
                {/* カテゴリ項目 */}
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    hover:bg-gray-50 dark:hover:bg-neutral-700
                    ${isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                      : 'border border-transparent'
                    }
                  `}
                >
                  {/* 展開/折りたたみアイコン */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  {/* カテゴリアイコン */}
                  <div className="flex-shrink-0">
                    <CategoryIcon iconName={category.icon} className="w-5 h-5 text-indigo-600" />
                  </div>

                  {/* カテゴリ名 */}
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm ${
                      isSelected
                        ? 'text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-900 dark:text-neutral-100'
                    }`}>
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                      {category.subcategories.length}項目
                    </div>
                  </div>
                </button>

                {/* サブカテゴリリスト */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {category.subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubcategoryId === subcategory.id;

                      return (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(subcategory)}
                          className={`
                            w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200
                            hover:bg-gray-50 dark:hover:bg-neutral-700
                            ${isSubSelected
                              ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-900 dark:text-indigo-100 border-l-2 border-indigo-500'
                              : 'text-gray-700 dark:text-neutral-300 border-l-2 border-transparent'
                            }
                          `}
                        >
                          <div className="font-medium">
                            {subcategory.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                            単位: {subcategory.unit}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* フッター情報 */}
      {selectedSubcategory && (
        <div className="p-4 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          <div className="text-xs space-y-1">
            <div>
              <span className="text-gray-600 dark:text-neutral-400">データ種別:</span>
              <span className="ml-1 text-gray-900 dark:text-neutral-100">
                {selectedSubcategory.dataType === 'numerical' ? '数値' :
                 selectedSubcategory.dataType === 'percentage' ? '割合' : '率'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-neutral-400">統計表ID:</span>
              <span className="ml-1 font-mono text-xs text-gray-900 dark:text-neutral-100">
                {selectedSubcategory.statsDataId}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};