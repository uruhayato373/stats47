/**
 * カテゴリカラースケールを生成
 *
 * 離散値を異なる色で表示するカラースケールを生成します。
 */

import type { CategoricalColorScaleOptions } from "../../types";

/**
 * カテゴリカラースケールを生成
 *
 * @param options - カテゴリカラースケールのオプション
 * @returns 値から色への変換関数
 */
export async function createCategoricalColorScale(
  options: CategoricalColorScaleOptions
): Promise<(value: number) => string> {
  const {
    data,
    categories = 10,
    noDataColor = "#e0e0e0",
    d3: providedD3,
  } = options;

  const d3 = providedD3 || (await import("d3")).default;

  if (!data || data.length === 0) {
    return () => noDataColor;
  }

  const colors = d3.schemeCategory10;
  const ordinalScale = d3.scaleOrdinal(colors);

  return (value: number) => {
    const index = Math.round(value) % categories;
    return ordinalScale(String(index));
  };
}
