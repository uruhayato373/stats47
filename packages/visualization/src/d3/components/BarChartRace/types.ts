import type { BaseD3ChartProps, ChartDataNode, MarginProps } from "../../types/base";

/** Bar Chart Race の1カテゴリ分のデータ */
export type BarChartRaceItem = Pick<ChartDataNode, "name" | "value">;

/**
 * Bar Chart Race の1フレーム（1時点）分のデータ
 *
 * service 層から受け取る入力データの型。
 * 描画に必要な rank や color は含まない（D3 が内部で計算する）。
 */
export interface BarChartRaceFrame {
  /** 時点ラベル（例: "2020"） */
  date: string;
  /** その時点のカテゴリ別データ */
  items: BarChartRaceItem[];
}

/** ソート・スライス後に rank を付与したアイテム。D3 データバインディング用 */
export interface RankedBarItem extends BarChartRaceItem {
  /** ソート後の順位（0始まり、topN 未満） */
  rank: number;
}

export interface BarChartRaceProps extends BaseD3ChartProps, MarginProps {
  /** フレームデータ（時系列順） */
  data: BarChartRaceFrame[];
  /** 表示する上位件数 @default 10 */
  topN?: number;
  /** 1フレームのアニメーション時間 (ms) @default 750 */
  duration?: number;
  /** 小数点以下の桁数（未指定時はデータから自動検出） */
  decimalPlaces?: number;
}
