export type { ChartDataNode, HierarchyDataNode } from '@stats47/types';

// ============================================================================
// 共通 Props
// ============================================================================

/**
 * 全 D3 チャートコンポーネントの共通 Props
 */
export interface BaseD3ChartProps {
  /** SVG の幅 (px) */
  width?: number;
  /** SVG の高さ (px) */
  height?: number;
  /** チャートタイトル */
  title?: string;
  /** 値の単位（ツールチップ等で表示） */
  unit?: string;
  /** カラーパレット */
  colors?: readonly string[];
  /** ローディングオーバーレイの表示 */
  isLoading?: boolean;
  /** ルート要素の追加クラス */
  className?: string;
}

/**
 * マージン指定を持つ D3 チャートの Props
 *
 * BarChart, ColumnChart, D3BarChartRace, Scatterplot, PyramidChart が該当。
 * DonutChart, SunburstChart, TreemapChart, 地図コンポーネントはマージン不要。
 */
export interface MarginProps {
  /** 上マージン */
  marginTop?: number;
  /** 右マージン */
  marginRight?: number;
  /** 下マージン */
  marginBottom?: number;
  /** 左マージン */
  marginLeft?: number;
}
