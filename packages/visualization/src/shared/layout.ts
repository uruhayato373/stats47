/**
 * チャートのレイアウト計算ユーティリティ
 */

export interface ChartMargins {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface ChartLayout extends ChartMargins {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

/**
 * マージンから描画領域（InnerSize）を算出する
 *
 * @param width - 全体の幅
 * @param height - 全体の高さ
 * @param margins - マージン
 * @returns レイアウト情報
 */
export function computeChartLayout(
  width: number,
  height: number,
  margins: ChartMargins
): ChartLayout {
  return {
    ...margins,
    width,
    height,
    innerWidth: Math.max(0, width - margins.marginLeft - margins.marginRight),
    innerHeight: Math.max(0, height - margins.marginTop - margins.marginBottom),
  };
}

/**
 * 基準サイズに対する比率でマージンを計算する
 *
 * @param width - 現在の幅
 * @param height - 現在の高さ
 * @param baseRatio - 基準となる比率 (例: { left: 100/800, top: 30/500, ... })
 * @returns 計算されたマージン
 */
export function computeMarginsByRatio(
  width: number,
  height: number,
  ratios: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
): ChartMargins {
  return {
    marginTop: Math.round(height * ratios.top),
    marginRight: Math.round(width * ratios.right),
    marginBottom: Math.round(height * ratios.bottom),
    marginLeft: Math.round(width * ratios.left),
  };
}

/**
 * 基準サイズ (base = min(width, height)) に対する比率でフォントサイズを計算する
 *
 * @param width - 幅
 * @param height - 高さ
 * @param ratio - 比率
 * @param minFontSize - 最小フォントサイズ (デフォルト: 8)
 * @returns 計算されたフォントサイズ
 */
export function computeFontSize(
  width: number,
  height: number,
  ratio: number,
  minFontSize: number = 8
): number {
  const base = Math.min(width, height);
  return Math.max(minFontSize, Math.round(base * ratio));
}
