/**
 * コロプレス地図表示機能用のJotaiアトム定義
 */

import { atom } from 'jotai';
import { CategoryData, SubcategoryData, ChoroplethDisplayData, MapVisualizationSettings } from '@/types/choropleth';
import { getSortedCategories } from '@/lib/choropleth/category-helpers';

// 基本状態アトム
export const selectedCategoryAtom = atom<string | null>(null);
export const selectedSubcategoryAtom = atom<string | null>(null);
export const selectedYearAtom = atom<string | null>(null);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// カテゴリデータアトム
export const categoriesAtom = atom<CategoryData[]>(getSortedCategories());

// 表示データアトム
export const choroplethDataAtom = atom<ChoroplethDisplayData | null>(null);

// 地図表示設定アトム
export const mapVisualizationSettingsAtom = atom<MapVisualizationSettings>({
  colorScheme: 'interpolateBlues',
  divergingMidpoint: 'zero',
  showLegend: true,
  showTooltip: true,
});

// 派生アトム
export const selectedCategoryDataAtom = atom<CategoryData | null>((get) => {
  const categories = get(categoriesAtom);
  const selectedCategoryId = get(selectedCategoryAtom);
  if (!selectedCategoryId) return null;
  return categories.find(cat => cat.id === selectedCategoryId) || null;
});

export const availableSubcategoriesAtom = atom<SubcategoryData[]>((get) => {
  const selectedCategory = get(selectedCategoryDataAtom);
  return selectedCategory?.subcategories || [];
});

export const selectedSubcategoryDataAtom = atom<SubcategoryData | null>((get) => {
  const subcategories = get(availableSubcategoriesAtom);
  const selectedSubcategoryId = get(selectedSubcategoryAtom);
  if (!selectedSubcategoryId) return null;
  return subcategories.find(sub => sub.id === selectedSubcategoryId) || null;
});

export const availableYearsAtom = atom<string[]>((get) => {
  const subcategory = get(selectedSubcategoryDataAtom);
  // デフォルトで過去5年分を設定（実際のデータ取得時に更新）
  if (!subcategory) return [];
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
});

// アクションアトム
export const setCategoryAtom = atom(
  null,
  (get, set, categoryId: string | null) => {
    set(selectedCategoryAtom, categoryId);
    // カテゴリが変更されたらサブカテゴリと年度をリセット
    set(selectedSubcategoryAtom, null);
    set(selectedYearAtom, null);
    set(choroplethDataAtom, null);
    set(errorAtom, null);
  }
);

export const setSubcategoryAtom = atom(
  null,
  (get, set, subcategoryId: string | null) => {
    set(selectedSubcategoryAtom, subcategoryId);
    // サブカテゴリが変更されたら年度をリセット
    set(selectedYearAtom, null);
    set(choroplethDataAtom, null);
    set(errorAtom, null);
  }
);

export const setYearAtom = atom(
  null,
  (get, set, year: string | null) => {
    set(selectedYearAtom, year);
    set(choroplethDataAtom, null);
    set(errorAtom, null);
  }
);

export const resetSelectionAtom = atom(
  null,
  (get, set) => {
    set(selectedCategoryAtom, null);
    set(selectedSubcategoryAtom, null);
    set(selectedYearAtom, null);
    set(choroplethDataAtom, null);
    set(errorAtom, null);
    set(loadingAtom, false);
  }
);