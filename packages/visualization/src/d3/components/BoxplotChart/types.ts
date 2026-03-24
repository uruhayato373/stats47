export interface PrefectureData {
  /** 都道府県コード（例: "01001" または "01"） */
  areaCode: string;
  /** 都道府県名（例: "北海道"） */
  areaName: string;
  /** 統計値 */
  value: number;
  /** 単位（例: "%" "人"） */
  unit?: string;
}

export interface BoxplotChartProps {
  /** 都道府県別データ（全国集計値 areaCode="00000" は自動除外） */
  data: PrefectureData[];
  /** 小数点以下の表示桁数（デフォルト: 0） */
  decimalPlaces?: number;
  /** Y軸の最小値（省略時は自動計算） */
  yAxisMin?: number;
  /** Y軸の最大値（省略時は自動計算） */
  yAxisMax?: number;
  /** SVG 内部幅（viewBox 基準）。デフォルト: 1200 */
  width?: number;
  /** Y軸最小値の扱い: "zero"（0始まり）| "data-min"（データ最小値基準） */
  minValueType?: "zero" | "data-min";
  /** className */
  className?: string;
}
