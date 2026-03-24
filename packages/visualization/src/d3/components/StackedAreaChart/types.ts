import type { BaseD3ChartProps, MarginProps } from "../../types/base";

/**
 * 積み上げ面グラフのデータノード
 *
 * X軸は categoryKey で指定したキー、Y軸は keys で指定した系列の合計。
 */
export interface StackedAreaDataNode {
  /** X軸のカテゴリ値（年度コード等） */
  category?: string;
  /** X軸の表示ラベル */
  label?: string;
  /** 各系列の値（keys で指定するキー） */
  [key: string]: string | number | undefined;
}

/** 系列の設定 */
export interface StackedAreaSeriesConfig {
  key: string;
  label: string;
  color: string;
}

/** D3 StackedAreaChart Props */
export interface D3StackedAreaChartProps extends BaseD3ChartProps, MarginProps {
  data: StackedAreaDataNode[];
  /** X軸に使うキー @default "category" */
  categoryKey?: string;
  /** 積み上げ系列の設定 */
  series: StackedAreaSeriesConfig[];
  /** 100% 積み上げモード @default false */
  normalize?: boolean;
  /** 凡例を表示するか @default true */
  showLegend?: boolean;
  /** Y軸のフォーマット関数 */
  yAxisFormatter?: (value: number) => string;
  /** ツールチップのフォーマット関数 */
  tooltipFormatter?: (value: number) => string;
  /** Y軸の固定ドメイン（指定時は自動スケーリングを上書き、normalize 時は無視） */
  yDomain?: [number, number];
}
