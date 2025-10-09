import React from "react";
import {
  SubcategoryPageProps,
  SubcategoryAreaPageProps,
  SubcategoryDashboardPageProps,
  SubcategoryRankingPageProps,
  CategoryConfig,
} from "@/types/subcategory";
import categories from "@/config/categories.json";

// カテゴリー別にインポート
import * as LandWeather from "./landweather";
import * as Population from "./population";
import * as LaborWage from "./laborwage";
import * as Agriculture from "./agriculture";
import * as MiningIndustry from "./miningindustry";
import * as Commercial from "./commercial";
import * as Economy from "./economy";
import * as Construction from "./construction";
import * as Energy from "./energy";
import * as Tourism from "./tourism";
import * as EducationSports from "./educationsports";
import * as AdministrativeFinancial from "./administrativefinancial";
import * as SafetyEnvironment from "./safetyenvironment";
import * as SocialSecurity from "./socialsecurity";
import * as International from "./international";
import * as Infrastructure from "./infrastructure";

// すべてのコンポーネントをマッピング
const componentMap: Record<string, any> = {
  ...LandWeather,
  ...Population,
  ...LaborWage,
  ...Agriculture,
  ...MiningIndustry,
  ...Commercial,
  ...Economy,
  ...Construction,
  ...Energy,
  ...Tourism,
  ...EducationSports,
  ...AdministrativeFinancial,
  ...SafetyEnvironment,
  ...SocialSecurity,
  ...International,
  ...Infrastructure,
};

// デフォルトのプレースホルダーコンポーネント
const DefaultDashboardPage: React.FC<SubcategoryDashboardPageProps> = ({
  category,
  subcategory,
  areaCode,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {subcategory.name} ダッシュボード
        </h2>
        <p className="text-gray-600 dark:text-neutral-400 mb-4">
          このページは現在開発中です。
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          実装方法については BasicPopulationDashboard.tsx を参考にしてください。
        </p>
      </div>
    </div>
  );
};

const DefaultRankingPage: React.FC<SubcategoryRankingPageProps> = ({
  category,
  subcategory,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {subcategory.name} ランキング
        </h2>
        <p className="text-gray-600 dark:text-neutral-400 mb-4">
          このページは現在開発中です。
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          実装方法については BasicPopulationRanking.tsx を参考にしてください。
        </p>
      </div>
    </div>
  );
};

// サブカテゴリーの情報を取得する関数
const getSubcategoryInfo = (subcategoryId: string, categoryId?: string) => {
  const typedCategories = categories as CategoryConfig[];
  const category = categoryId
    ? typedCategories.find((cat) => cat.id === categoryId)
    : undefined;

  if (category) {
    return category.subcategories.find((sub) => sub.id === subcategoryId);
  }

  return typedCategories
    .flatMap((cat) => cat.subcategories)
    .find((sub) => sub.id === subcategoryId);
};

/**
 * ダッシュボードコンポーネントを取得
 */
export const getDashboardComponent = (
  subcategoryId: string,
  categoryId?: string
): React.ComponentType<SubcategoryDashboardPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);

  if (!subcategory?.dashboardComponent) {
    return DefaultDashboardPage;
  }

  return componentMap[subcategory.dashboardComponent] || DefaultDashboardPage;
};

/**
 * ランキングコンポーネントを取得
 */
export const getRankingComponent = (
  subcategoryId: string,
  categoryId?: string
): React.ComponentType<SubcategoryRankingPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);

  if (!subcategory?.rankingComponent) {
    return DefaultRankingPage;
  }

  return componentMap[subcategory.rankingComponent] || DefaultRankingPage;
};

/**
 * サブカテゴリーIDに対応するコンポーネントを取得（後方互換性のため維持）
 * @deprecated getDashboardComponent を使用してください
 */
export const getSubcategoryComponent = (
  subcategoryId: string,
  categoryId?: string
): React.ComponentType<SubcategoryPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);
  if (!subcategory?.dashboardComponent) return DefaultDashboardPage;

  return componentMap[subcategory.dashboardComponent] || DefaultDashboardPage;
};

/**
 * サブカテゴリーIDに対応する都道府県別ページコンポーネントを取得（後方互換性のため維持）
 * @deprecated getDashboardComponent を使用してください
 */
export const getAreaPageComponent = (
  subcategoryId: string
): React.ComponentType<SubcategoryAreaPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId);

  if (!subcategory?.dashboardComponent) {
    return DefaultDashboardPage;
  }

  const component = componentMap[subcategory.dashboardComponent];

  return component || DefaultDashboardPage;
};

// 共通コンポーネント
export { SubcategoryLayout } from "./SubcategoryLayout";
export { ViewSwitchButtons } from "./ViewSwitchButtons";
export { PrefectureSelector } from "./PrefectureSelector";

// カテゴリー別エクスポート
export * from "./landweather";
export * from "./population";
export * from "./laborwage";
export * from "./agriculture";
export * from "./miningindustry";
export * from "./commercial";
export * from "./economy";
export * from "./construction";
export * from "./energy";
export * from "./tourism";
export * from "./educationsports";
export * from "./administrativefinancial";
export * from "./safetyenvironment";
export * from "./socialsecurity";
export * from "./international";
export * from "./infrastructure";
