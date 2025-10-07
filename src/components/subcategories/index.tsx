import React from "react";
import {
  SubcategoryPageProps,
  SubcategoryAreaPageProps,
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
};

// デフォルトのプレースホルダーコンポーネント
const DefaultSubcategoryPage: React.FC<
  SubcategoryPageProps | SubcategoryAreaPageProps
> = ({ category, subcategory }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {subcategory.name}
        </h2>
        <p className="text-gray-600 dark:text-neutral-400 mb-4">
          このページは現在開発中です。
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-500">
          実装方法については BasicPopulationPage.tsx を参考にしてください。
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
 * サブカテゴリーIDに対応するコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getSubcategoryComponent = (
  subcategoryId: string,
  categoryId?: string
): React.ComponentType<SubcategoryPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId, categoryId);
  if (!subcategory?.component) return DefaultSubcategoryPage;

  return componentMap[subcategory.component] || DefaultSubcategoryPage;
};

/**
 * サブカテゴリーIDに対応する都道府県別ページコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getAreaPageComponent = (
  subcategoryId: string
): React.ComponentType<SubcategoryAreaPageProps> => {
  const subcategory = getSubcategoryInfo(subcategoryId);

  if (!subcategory?.areaComponent) {
    return DefaultSubcategoryPage;
  }

  const component = componentMap[subcategory.areaComponent];

  return component || DefaultSubcategoryPage;
};

// 共通コンポーネント
export { SubcategoryLayout } from "./SubcategoryLayout";
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
