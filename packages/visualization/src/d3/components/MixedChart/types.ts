import type { BaseD3ChartProps, MarginProps } from "../../types/base";
import type { TimeSeriesDataNode, LineSeriesConfig } from "../LineChart/types";

/** 棒+折れ線ミックスチャートの Props */
export interface MixedChartProps extends BaseD3ChartProps, MarginProps {
  data: TimeSeriesDataNode[];
  /** X軸に使うキー @default "category" */
  categoryKey?: string;
  /** 棒グラフ系列（左Y軸） */
  columns: LineSeriesConfig[];
  /** 折れ線系列（右Y軸） */
  lines: LineSeriesConfig[];
  /** 左Y軸の単位 */
  leftUnit?: string;
  /** 右Y軸の単位 */
  rightUnit?: string;
  /** 左Y軸のフォーマット関数 */
  leftAxisFormatter?: (value: number) => string;
  /** 右Y軸のフォーマット関数 */
  rightAxisFormatter?: (value: number) => string;
}
