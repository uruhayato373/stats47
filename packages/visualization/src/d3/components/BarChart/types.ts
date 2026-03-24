import type { BaseD3ChartProps, ChartDataNode, MarginProps } from "../../types/base";

export interface BarChartProps extends BaseD3ChartProps, MarginProps {
  /** 表示するデータ */
  data: ChartDataNode[];
  /** スタックする項目のキーの配列（積み上げ・グループ時必須） */
  keys?: string[];
  /** 単一系列の値キー（非積み上げ時に使用） @default "value" */
  valueKey?: string;
  /** Y軸に使用するキー @default "name" */
  indexBy?: string;
  /** X軸のラベル */
  xLabel?: string;
  /** Y軸のラベル */
  yLabel?: string;
  /** 数値のフォーマット関数 */
  valueFormat?: (value: number) => string;
  /** 凡例を表示するか @default false */
  showLegend?: boolean;
  /** X軸（値軸）の固定ドメイン（指定時は自動スケーリングを上書き） */
  xDomain?: [number, number];
  /** 複数系列の描画モード @default "stacked" */
  mode?: "stacked" | "grouped";
}
