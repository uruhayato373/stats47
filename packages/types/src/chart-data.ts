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

export interface ChartSeriesData {
  dataKey: string;
  name: string;
  color: string;
  yAxis?: 'left' | 'right';
}
export interface RadarAxisIdentity {
  key: string;
  label: string;
}
