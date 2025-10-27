/**
 * ダッシュボードの設定型定義
 */

export type AreaType = 'national' | 'prefecture';

export type LayoutType = 'grid' | 'stacked' | 'custom';

/**
 * ダッシュボードの基本設定
 */
export interface DashboardConfig {
  id: number;
  subcategoryId: string;
  areaType: AreaType;
  layoutType: LayoutType;
  version: number;
  isActive: boolean;
}

/**
 * レイアウトのグリッド設定
 */
export interface GridConfig {
  columns: number;
  gap: string;
  responsive?: {
    mobile?: { columns: number };
    tablet?: { columns: number };
    desktop?: { columns: number };
  };
}

/**
 * レイアウトセクション
 */
export interface LayoutSection {
  id: string;
  title?: string;
  gridArea?: string;
  widgetSlots: number;
}

/**
 * レイアウトテンプレート
 */
export interface LayoutTemplate {
  version: string;
  layoutType: LayoutType;
  gridConfig?: GridConfig;
  sections: LayoutSection[];
}
