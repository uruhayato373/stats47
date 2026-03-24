// packages/visualization/src/d3/types/base.ts

// ============================================================================
// 共通データノード型
// ============================================================================

/**
 * フラットなカテゴリ×値のデータノード
 *
 * BarChart, ColumnChart, DonutChart, 地図コンポーネント等で共通使用。
 * 積み上げ用の追加系列は index signature で受け取る。
 */
export interface ChartDataNode {
  /** カテゴリ名（軸ラベル・凡例に表示） */
  name: string;
  /** 主値 */
  value: number;
  /** コード（areaCode, categoryCode 等。リンク・識別用） */
  code?: string;
  /** 積み上げ・複数系列用の追加値 */
  [key: string]: string | number | undefined;
}

/**
 * 階層データノード（Sunburst / Treemap 共用）
 */
export interface HierarchyDataNode {
  /** ノード名 */
  name: string;
  /** 値（末端ノード用。親ノードは children の合計が自動計算される） */
  value?: number;
  /** 子ノード */
  children?: HierarchyDataNode[];
  /** 色（省略時は D3 カラースキームを使用） */
  color?: string;
  /** 追加メタデータ */
  metadata?: Record<string, unknown>;
}

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
