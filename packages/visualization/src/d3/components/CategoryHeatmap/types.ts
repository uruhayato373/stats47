export interface HeatmapCell {
  /** X軸ラベル（例: "2024年"） */
  x: string;
  /** Y軸ラベル（例: "食料"） */
  y: string;
  /** セルの値 */
  value: number;
}

export interface CategoryHeatmapProps {
  /** データ配列 */
  data: HeatmapCell[];
  /** 基準値（色の中心）デフォルト: 100 */
  baseline?: number;
  /** 基準値より上の色 */
  positiveColor?: string;
  /** 基準値より下の色 */
  negativeColor?: string;
  /** 値の単位 */
  unit?: string;
  /** SVG 幅 */
  width?: number;
  /** SVG 高さ */
  height?: number;
  /** CSS クラス */
  className?: string;
}
