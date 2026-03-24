import type { BaseD3ChartProps, MarginProps } from "../../types/base";

export interface DivergingBarChartProps extends BaseD3ChartProps, MarginProps {
  /** データ配列（各行に categoryKey + positiveKey + negativeKey を含む） */
  data: Array<Record<string, string | number>>;
  /** X軸（カテゴリ）キー（例: "year"） */
  categoryKey: string;
  /** 上方向に描画する系列のデータキー */
  positiveKey: string;
  /** 下方向に描画する系列のデータキー */
  negativeKey: string;
  /** 上方向系列のラベル */
  positiveName: string;
  /** 下方向系列のラベル */
  negativeName: string;
  /** 上方向系列の色 */
  positiveColor?: string;
  /** 下方向系列の色 */
  negativeColor?: string;
  /** Y軸フォーマッター */
  yAxisFormatter?: (d: number) => string;
  /** Y軸ドメイン（syncYAxis用） */
  yDomain?: [number, number];
}
