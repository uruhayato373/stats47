// カテゴリー別にインポート
import { LandAreaPage } from './landweather';
import { BasicPopulationPage } from './population';
import { WagesWorkingConditionsPage } from './laborwage';
import { SubcategoryPageClient } from '@/components/choropleth/SubcategoryPageClient';

// サブカテゴリーIDとコンポーネントのマッピング
export const subcategoryComponentMap: Record<string, React.ComponentType<any>> = {
  // 国土・気象
  'land-area': LandAreaPage,

  // 人口・世帯
  'basic-population': BasicPopulationPage,

  // 労働・賃金
  'wages-working-conditions': WagesWorkingConditionsPage,

  // 他のサブカテゴリーはデフォルトコンポーネントを使用
};

/**
 * サブカテゴリーIDに対応するコンポーネントを取得
 * マッピングが存在しない場合はデフォルトコンポーネントを返す
 */
export const getSubcategoryComponent = (subcategoryId: string): React.ComponentType<any> => {
  return subcategoryComponentMap[subcategoryId] || SubcategoryPageClient;
};

// 共通コンポーネント
export { SubcategoryLayout } from './SubcategoryLayout';

// カテゴリー別エクスポート
export * from './landweather';
export * from './population';
export * from './laborwage';