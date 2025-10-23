/**
 * コロプレス地図表示機能用のZustandストア定義
 */

import { create } from "zustand";
import {
  CategoryData,
  SubcategoryData,
  MapVisualizationSettings,
} from "@/types/visualization/choropleth";
import { getAllCategories } from "@/lib/category";
import type { Category } from "@/lib/category";

// CategoryServiceの戻り値をCategoryData型に変換
const convertToCategoryData = (category: Category): CategoryData => ({
  id: category.id,
  name: category.name,
  description: category.description || "",
  icon: category.icon || "",
  subcategories: (category.subcategories || []).map((sub) => ({
    id: sub.id,
    categoryId: sub.categoryId,
    name: sub.name,
    displayOrder: sub.displayOrder,
    component: sub.dashboardComponent,
  })),
  displayOrder: category.displayOrder || 0,
});

interface ChoroplethStore {
  // 基本状態
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  selectedYear: string | null;
  loading: boolean;
  error: string | null;
  
  // カテゴリデータ
  categories: CategoryData[];
  
  // 地図表示設定
  mapVisualizationSettings: MapVisualizationSettings;
  
  // 派生状態（getter）
  getSelectedCategoryData: () => CategoryData | null;
  getAvailableSubcategories: () => SubcategoryData[];
  getSelectedSubcategoryData: () => SubcategoryData | null;
  getAvailableYears: () => string[];
  
  // アクション
  setCategory: (categoryId: string | null) => void;
  setSubcategory: (subcategoryId: string | null) => void;
  setYear: (year: string | null) => void;
  resetSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateMapSettings: (settings: Partial<MapVisualizationSettings>) => void;
}

export const useChoroplethStore = create<ChoroplethStore>((set, get) => ({
  // 基本状態の初期値
  selectedCategory: null,
  selectedSubcategory: null,
  selectedYear: null,
  loading: false,
  error: null,
  
  // カテゴリデータの初期値
  categories: getAllCategories().map(convertToCategoryData),
  
  // 地図表示設定の初期値
  mapVisualizationSettings: {
    colorScheme: "interpolateBlues",
    divergingMidpoint: "zero",
    showLegend: true,
    showTooltip: true,
  },
  
  // 派生状態のgetter
  getSelectedCategoryData: () => {
    const { categories, selectedCategory } = get();
    if (!selectedCategory) return null;
    return categories.find((cat) => cat.id === selectedCategory) || null;
  },
  
  getAvailableSubcategories: () => {
    const selectedCategoryData = get().getSelectedCategoryData();
    return selectedCategoryData?.subcategories || [];
  },
  
  getSelectedSubcategoryData: () => {
    const subcategories = get().getAvailableSubcategories();
    const { selectedSubcategory } = get();
    if (!selectedSubcategory) return null;
    return subcategories.find((sub) => sub.id === selectedSubcategory) || null;
  },
  
  getAvailableYears: () => {
    const subcategory = get().getSelectedSubcategoryData();
    // デフォルトで過去5年分を設定（実際のデータ取得時に更新）
    if (!subcategory) return [];
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  },
  
  // アクション
  setCategory: (categoryId) => {
    set((state) => ({
      selectedCategory: categoryId,
      // カテゴリが変更されたらサブカテゴリと年度をリセット
      selectedSubcategory: null,
      selectedYear: null,
      error: null,
    }));
  },
  
  setSubcategory: (subcategoryId) => {
    set((state) => ({
      selectedSubcategory: subcategoryId,
      // サブカテゴリが変更されたら年度をリセット
      selectedYear: null,
      error: null,
    }));
  },
  
  setYear: (year) => {
    set((state) => ({
      selectedYear: year,
      error: null,
    }));
  },
  
  resetSelection: () => {
    set({
      selectedCategory: null,
      selectedSubcategory: null,
      selectedYear: null,
      error: null,
      loading: false,
    });
  },
  
  setLoading: (loading) => {
    set({ loading });
  },
  
  setError: (error) => {
    set({ error });
  },
  
  updateMapSettings: (settings) => {
    set((state) => ({
      mapVisualizationSettings: {
        ...state.mapVisualizationSettings,
        ...settings,
      },
    }));
  },
}));
