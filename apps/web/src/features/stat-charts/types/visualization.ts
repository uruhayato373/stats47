/**
 * 各 Visualization コンポーネントが受け取るデータ型
 * アダプターが e-Stat API レスポンスをこれらの型に変換する
 */

/** 棒グラフ用データ（Recharts形式） */
export interface BarChartData {
  /** カテゴリ軸のキー（例: "year", "name"） */
  categoryKey: string;
  /** データ配列 */
  data: Array<Record<string, string | number>>;
  /** 系列設定 */
  series: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  /** 単位（任意） */
  unit?: string;
}

/** 折れ線グラフ用データ（Recharts形式） */
export interface LineChartData {
  /** X軸のキー（通常 "year"） */
  xAxisKey: string;
  /** データ配列 */
  data: Array<Record<string, string | number>>;
  /** 系列設定 */
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  /** 単位（任意） */
  unit?: string;
}

/** 棒+折れ線ミックスチャート用データ（2軸） */
export interface MixedChartData {
  /** X軸のキー（通常 "year"） */
  xAxisKey: string;
  /** データ配列 */
  data: Array<Record<string, string | number>>;
  /** 棒グラフ系列（左Y軸） */
  columns: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  /** 折れ線系列（右Y軸） */
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  /** 左Y軸の単位 */
  leftUnit?: string;
  /** 右Y軸の単位 */
  rightUnit?: string;
}

/** Treemap/Sunburst 用階層データ（D3形式・HierarchyDataNode 互換） */
export interface HierarchyData {
  name: string;
  value?: number;
  children?: HierarchyData[];
}

/** バーチャートレース用データ（アダプター内部・年度別フレーム） */
export interface BarChartRaceData {
  /** 年度リスト */
  years: string[];
  /** 各年度のランキングデータ */
  frames: Array<{
    year: string;
    data: Array<{
      name: string;
      value: number;
      rank: number;
    }>;
  }>;
  /** 単位 */
  unit?: string;
}

/** 統計カード用データ */
export interface StatCardData {
  value: number | null;
  unit: string | null;
  year: string | null;
}

/** KPI カード用データ（値 + 前年比） */
export interface KpiCardData {
  value: number | null;
  unit: string | null;
  year: string | null;
  changeRate: number | null;
  changeDirection: "increase" | "decrease" | "neutral" | null;
}

/** 統計テーブル行データ */
export interface StatsTableRowData {
  label: string;
  value: number | null;
  unit: string | null;
  year: string | null;
  rankingLink?: string;
}

/** 統計テーブル全体データ（年度切り替え対応） */
export interface StatsTableData {
  years: Array<{ yearCode: string; yearName: string }>;
  dataByYear: Record<string, StatsTableRowData[]>;
}

/** 属性マトリクス用データ（行×列のヒートマップ風テーブル） */
export interface AttributeMatrixData {
  columns: string[];
  rows: Array<{
    label: string;
    values: Array<number | null>;
  }>;
  unit?: string;
}
