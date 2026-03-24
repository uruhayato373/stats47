import type { BaseD3ChartProps, HierarchyDataNode } from "../../types/base";

export interface TreemapChartProps extends BaseD3ChartProps {
  /** 階層データ（ルートは name + children） */
  data: HierarchyDataNode;
  /** ノードクリック時のコールバック */
  onNodeClick?: (node: HierarchyDataNode) => void;
}
