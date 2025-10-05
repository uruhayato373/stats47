// カテゴリー別にインポート
import { LandAreaPage, LandUsePage, NaturalEnvironmentPage, WeatherClimatePage } from './landweather';
import { BasicPopulationPage, BasicPopulationAreaPage, MarriagePage, HouseholdsPage, PopulationMovementPage, BirthDeathPage } from './population';
import { WagesWorkingConditionsPage } from './laborwage';
import { SubcategoryPageClient } from '@/components/choropleth/SubcategoryPageClient';

// サブカテゴリーIDとコンポーネントのマッピング
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 国土・気象
  'land-area': LandAreaPage,
  'land-use': LandUsePage,
  'natural-environment': NaturalEnvironmentPage,
  'weather-climate': WeatherClimatePage,

  // 人口・世帯
  'basic-population': BasicPopulationPage,
  'marriage': MarriagePage,
  'households': HouseholdsPage,
  'population-movement': PopulationMovementPage,
  'birth-death': BirthDeathPage,

  // 労働・賃金
  'wages-working-conditions': WagesWorkingConditionsPage,

  // 他のサブカテゴリーはデフォルトコンポーネントを使用
};

// 都道府県別ページのコンポーネントマッピング
export const areaPageComponentMap: Record<string, React.ComponentType<any>> = {
  // 人口・世帯
  'basic-population': BasicPopulationAreaPage,

  // 他のサブカテゴリーはデフォルトコンポーネントを使用
};

/**
 * サブカテゴリーIDに対応するコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getSubcategoryComponent = (subcategoryId: string): React.ComponentType<any> => {
  return subcategoryComponentMap[subcategoryId] || SubcategoryPageClient;
};

/**
 * サブカテゴリーIDに対応する都道府県別ページコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getAreaPageComponent = (subcategoryId: string): React.ComponentType<any> => {
  return areaPageComponentMap[subcategoryId] || SubcategoryPageClient;
};

// 共通コンポーネント
export { SubcategoryLayout } from './SubcategoryLayout';

// カテゴリー別エクスポート
export * from './landweather';
export * from './population';
export * from './laborwage';