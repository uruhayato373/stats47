import type { BaseD3ChartProps, ChartDataNode } from "../../types/base";

/** DonutChart のデータノード */
export interface DonutChartDataNode extends ChartDataNode {
  /** 色（オプション） */
  color?: string;
}

export interface DonutChartProps extends BaseD3ChartProps {
  /** 表示するデータ */
  data: DonutChartDataNode[];
  /** 内側の半径 @default radius / 2 */
  innerRadius?: number;
  /** 外側の半径 @default min(width, height) / 2 - margin */
  outerRadius?: number;
  /** ラベルの表示閾値（割合） @default 0.05 */
  labelThreshold?: number;
  /** ドーナツの中心に表示するテキスト */
  centerText?: string;
  /** ノードクリック時のコールバック */
  onNodeClick?: (node: DonutChartDataNode) => void;
}
