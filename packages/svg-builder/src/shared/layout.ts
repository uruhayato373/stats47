/**
 * SVG レイアウト・viewBox ヘルパー
 */

export interface PlotArea {
  /** プロットエリア左端 X 座標 */
  left: number;
  /** プロットエリア上端 Y 座標 */
  top: number;
  /** プロットエリア右端 X 座標 */
  right: number;
  /** プロットエリア下端 Y 座標 */
  bottom: number;
  /** プロットエリア幅 */
  width: number;
  /** プロットエリア高さ */
  height: number;
}

/**
 * SVG 全体サイズとマージンからプロットエリアを計算する
 */
export function makePlotArea(
  svgWidth: number,
  svgHeight: number,
  margin: { top: number; right: number; bottom: number; left: number },
): PlotArea {
  const left = margin.left;
  const top = margin.top;
  const right = svgWidth - margin.right;
  const bottom = svgHeight - margin.bottom;
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * viewBox 文字列を生成する
 */
export function viewBox(width: number, height: number): string {
  return `0 0 ${width} ${height}`;
}

/**
 * 数値を SVG 属性用に小数点 1 桁でフォーマットする
 */
export function px(n: number): string {
  return n.toFixed(1);
}
