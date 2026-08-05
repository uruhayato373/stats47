import type { BaseD3ChartProps, MarginProps } from "../../types/base";

/**
 * 時系列データノード（折れ線グラフ用）
 *
 * X軸は categoryKey で指定したキー、Y軸は valueKey または series[].dataKey で指定。
 * ダッシュボードからは { yearCode, year, value } や { yearCode, year, "男性", "女性" } が渡される。
 */
export interface TimeSeriesDataNode {
  /** X軸のカテゴリ値（年度コード等） */
  category?: string;
  /** X軸の表示ラベル（年度名等） */
  label?: string;
  /** 主値（単一系列） */
  value?: number;
  /** 複数系列用の追加値 */
  [key: string]: string | number | undefined;
}

/** 系列の設定 */
export interface LineSeriesConfig {
  dataKey: string;
  name: string;
  color: string;
  /**
   * 線を破線にする SVG の stroke-dasharray（例 `"6,4"`）。省略時は実線。
   *
   * 用途は「主系列と比較系列を線種で区別する」こと。色だけで区別すると
   * 系列数が増えたときに識別できず、色覚特性によっては差が伝わらない。
   */
  strokeDasharray?: string;
  /**
   * データ点の丸を描かない。比較系列（背景として薄く添える線）で、
   * 主系列の点と混ざって読みづらくなるのを避けるために使う。
   */
  hidePoints?: boolean;
}

/** D3 LineChart Props */
export interface D3LineChartProps extends BaseD3ChartProps, MarginProps {
  data: TimeSeriesDataNode[];
  /** X軸に使うキー @default "category" */
  categoryKey?: string;
  /** Y軸に使うキー（単一系列） @default "value" */
  valueKey?: string;
  /** 複数系列の設定 */
  series?: LineSeriesConfig[];
  /** 凡例を表示するか @default false */
  showLegend?: boolean;
  /** Y軸のフォーマット関数 */
  yAxisFormatter?: (value: number) => string;
  /** ツールチップのフォーマット関数 */
  tooltipFormatter?: (value: number) => string;
  /** Y軸の固定ドメイン（指定時は自動スケーリングを上書き） */
  yDomain?: [number, number];
}
