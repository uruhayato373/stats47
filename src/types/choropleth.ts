/**
 * コロプレス地図表示機能の型定義
 */

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: SubcategoryData[];
  displayOrder: number;
}

export interface SubcategoryData {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  unit: string;
  dataType: 'numerical' | 'percentage' | 'rate';
  statsDataId: string;
  tableName: string;
  displayOrder: number;
  colorScheme?: string;
  categoryCode?: string;
  lastUpdated?: string;
  availableYears?: string[];
}

export interface ChoroplethDataPoint {
  prefectureCode: string;
  prefectureName: string;
  value: number;
  displayValue: string;
  rank: number;
}

export interface ChoroplethDisplayData {
  subcategory: SubcategoryData;
  year: string;
  data: ChoroplethDataPoint[];
  lastUpdated: string;
  source: string;
  total?: number;
  average?: number;
  median?: number;
}

export interface MapVisualizationSettings {
  colorScheme: string;
  divergingMidpoint: 'zero' | 'mean' | 'median' | number;
  showLegend: boolean;
  showTooltip: boolean;
}