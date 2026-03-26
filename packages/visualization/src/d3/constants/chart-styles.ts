/**
 * 全 D3 チャートコンポーネントの共通スタイル定数
 *
 * 各コンポーネントのハードコード値をここに集約。
 * スタイル変更はこのファイルを編集するだけで全チャートに反映される。
 */

/** グリッド線のスタイル */
export const GRID = {
  /** グリッド線の透明度（0〜1） */
  strokeOpacity: 0.1,
} as const;

/** フォントサイズ計算の比率 */
export const FONT = {
  /** 標準チャートのフォントサイズ比率（min(width, height) * ratio） */
  sizeRatio: 0.025,
  /** コンパクトチャート（レーダー・サンバースト等）のフォントサイズ比率 */
  sizeRatioCompact: 0.022,
  /** 最小フォントサイズ（px） */
  minFontSize: 12,
} as const;

/**
 * マージン比率プリセット
 *
 * computeMarginsByRatio(width, height, preset) に渡す。
 * 各値は「基準サイズ（800x500）でのピクセル値 / 基準サイズ」の比率。
 */
export const MARGIN = {
  /** 時系列チャート（折れ線・積み上げ面等） */
  timeSeries: { top: 40 / 500, right: 20 / 800, bottom: 50 / 500, left: 55 / 800 },
  /** 2軸チャート（MixedChart — 左右Y軸のラベル領域を広めに） */
  dualAxis: { top: 20 / 500, right: 60 / 800, bottom: 50 / 500, left: 60 / 800 },
  /** 横棒グラフ（左にラベル領域が広い） */
  horizontal: { top: 30 / 500, right: 30 / 800, bottom: 30 / 500, left: 100 / 800 },
  /** コンパクト（縦棒グラフ等） */
  compact: { top: 20 / 500, right: 20 / 800, bottom: 50 / 500, left: 50 / 800 },
} as const;

/** 軸の表示設定 */
export const AXIS = {
  /** X軸ティックの dy（文字の下方向オフセット） */
  tickPaddingX: 8,
  /** Y軸ティックの dx（文字の左方向オフセット） */
  tickPaddingY: -4,
  /** 時系列の年度表示間隔 */
  tickInterval: 5,
  /** Y軸ティック数の計算係数（innerHeight / この値） */
  yTickDensity: 40,
} as const;

/** 折れ線のスタイル */
export const LINE = {
  /** 標準の線幅（px） */
  width: 1.5,
  /** 2軸チャートの線幅（棒と区別するため太めに） */
  widthDualAxis: 2,
} as const;

/** データポイントのスタイル */
export const POINT = {
  /** 通常時の半径（px） */
  radius: 3,
  /** ハイライト時の半径（px） */
  radiusHighlight: 5,
} as const;

/** クロスヘア（ホバー時の垂直/水平線） */
export const CROSSHAIR = {
  dashArray: "4,3",
  opacity: 0.5,
} as const;

/**
 * Y軸ラベルの省略フォーマッター
 *
 * 大きな数値を「万」「千」で省略表示してラベルの幅を抑える。
 * 小数値はそのまま表示。
 */
export function compactAxisFormat(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}億`;
  if (abs >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}千`;
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}

/**
 * 一括エクスポート
 *
 * 使用例:
 * ```typescript
 * import { CHART_STYLES } from "../../constants";
 * const margins = computeMarginsByRatio(w, h, CHART_STYLES.margin.timeSeries);
 * ```
 */
export const CHART_STYLES = {
  grid: GRID,
  font: FONT,
  margin: MARGIN,
  axis: AXIS,
  line: LINE,
  point: POINT,
  crosshair: CROSSHAIR,
} as const;
