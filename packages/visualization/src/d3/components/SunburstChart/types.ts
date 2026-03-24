import type { BaseD3ChartProps, HierarchyDataNode } from "../../types/base";

export interface SunburstChartProps extends BaseD3ChartProps {
  /** 階層データ */
  data: HierarchyDataNode;
  /** セグメントクリック時のコールバック */
  onNodeClick?: (node: HierarchyDataNode) => void;
}
