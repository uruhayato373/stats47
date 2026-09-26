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
  minFontSize: number = 12
): number {
  const base = Math.min(width, height);
  return Math.max(minFontSize, Math.round(base * ratio));
}

/**
 * 文字列の描画幅をフォントサイズから見積もる。
 * 英数字・記号は 0.6em、それ以外 (万・億・％ などの全角) は 1em とする。
 * SSR では getComputedTextLength が使えないため、実測ではなく見積もりで余白を決める。
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += /[\x20-\x7e]/.test(ch) ? 0.6 : 1;
  return em * fontSize;
}

/** d3 の axisLeft がラベルを軸から離す距離 (tickSize 6 + tickPadding 3) に、各チャートの dx -4 と余裕 3 を足した値 */
const LEFT_AXIS_LABEL_OFFSET = 16;

/**
 * 縦軸の目盛りラベルが左端で切れない左余白を返す。比率で決めた余白が足りるならそのまま使う。
 * 幅の狭いグラフで「1,400万」の先頭が切れて「400万」と読めた (2026-09-25) ための下限。
 */
export function leftMarginForTickLabels(
  labels: string[],
  fontSize: number,
  minimum: number,
): number {
  const widest = Math.max(0, ...labels.map((label) => estimateTextWidth(label, fontSize)));
  return Math.max(minimum, Math.ceil(widest + LEFT_AXIS_LABEL_OFFSET));
}
