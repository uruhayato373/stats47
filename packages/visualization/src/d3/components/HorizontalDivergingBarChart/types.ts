export interface DivergingBarItem {
  label: string;
  value: number;
}

export interface HorizontalDivergingBarChartProps {
  /** データ配列 */
  data: DivergingBarItem[];
  /** 基準値（中心線）デフォルト: 100 */
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
