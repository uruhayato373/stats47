import type { BaseD3ChartProps } from "../../types/base";

/** レーダーチャートの軸定義 */
export interface RadarAxis {
  /** 軸のキー（データから値を取得するキー） */
  key: string;
  /** 軸の表示ラベル */
  label: string;
  /** 軸の最大値（省略時は全データから自動算出） */
  max?: number;
}

/** レーダーチャートのデータ系列 */
export interface RadarDataSeries {
  /** 系列のラベル */
  label: string;
  /** 軸キー → 値のマッピング */
  values: Record<string, number>;
  /** 系列の色（省略時はカラーパレットから自動割当） */
  color?: string;
}

/** D3 RadarChart Props */
export interface D3RadarChartProps extends BaseD3ChartProps {
  /** 軸定義（5-8 軸推奨） */
  axes: RadarAxis[];
  /** データ系列（複数系列の重ね合わせ可） */
  data: RadarDataSeries[];
  /** グリッド線の本数 @default 5 */
  gridLevels?: number;
  /** 塗りつぶしの不透明度 @default 0.15 */
  fillOpacity?: number;
  /** 凡例を表示するか @default true */
  showLegend?: boolean;
  /** ツールチップのフォーマット関数 */
  tooltipFormatter?: (value: number) => string;
}
