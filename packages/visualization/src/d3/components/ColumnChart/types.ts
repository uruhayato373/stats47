import type { BaseD3ChartProps, ChartDataNode, MarginProps } from "../../types/base";

export interface ColumnChartProps extends BaseD3ChartProps, MarginProps {
  /**
   * チャートに表示するデータ配列
   * @example [{ state: "CA", age: "<10", population: 4822023 }, ...]
   */
  data: ChartDataNode[];
  /**
   * 各棒のインデックス（カテゴリ）となるキー
   * @example "state"
   */
  indexBy: string;
  /**
   * 積み上げる各層のキー配列
   * @example ["<10", "10-19", "20-29", ...]
   */
  keys: string[];
  /**
   * Y軸のフォーマッター
   */
  yAxisFormatter?: (d: number) => string;
  /**
   * ツールチップのフォーマッター
   */
  tooltipFormatter?: (d: { key: string; value: number; indexValue: string }) => string;
}
