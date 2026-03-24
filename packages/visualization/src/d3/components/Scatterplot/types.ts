import type { BaseD3ChartProps, MarginProps } from "../../types/base";

/** 散布図のデータノード（2次元座標のため ChartDataNode とは別構造） */
export interface ScatterplotDataNode {
  /** X軸の値 */
  x: number | Date;
  /** Y軸の値 */
  y: number | Date;
  /** ラベル（ツールチップなどで使用） */
  label?: string;
  /** カテゴリ（色分けなどで使用） */
  category?: string;
  /** 追加のメタデータ */
  [key: string]: any;
}

export interface ScatterplotProps extends BaseD3ChartProps, MarginProps {
  /** プロットするデータ */
  data: ScatterplotDataNode[];
  /** X軸のラベル */
  xLabel?: string;
  /** Y軸のラベル */
  yLabel?: string;
  /** X軸の種類 @default "linear" */
  xType?: "linear" | "log" | "time";
  /** Y軸の種類 @default "linear" */
  yType?: "linear" | "log" | "time";
  /** X軸のドメイン [min, max] */
  xDomain?: [number, number] | [Date, Date];
  /** Y軸のドメイン [min, max] */
  yDomain?: [number, number] | [Date, Date];
  /** X軸のフォーマット */
  xFormat?: string;
  /** Y軸のフォーマット */
  yFormat?: string;
  /** グリッド線を表示するか @default true */
  grid?: boolean;
  /** 点の半径 @default 3 */
  r?: number;
  /** 点の枠線の色 @default "currentColor" */
  stroke?: string;
  /** 点の枠線の太さ @default 1.5 */
  strokeWidth?: number;
  /** 点の枠線の透明度 @default 1 */
  strokeOpacity?: number;
  /** 点の塗りつぶし色 @default "none" */
  fill?: string;
  /** 回帰直線 (y = slope * x + intercept) */
  regressionLine?: { slope: number; intercept: number };
}
