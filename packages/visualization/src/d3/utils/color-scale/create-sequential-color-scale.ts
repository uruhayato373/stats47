/* eslint-disable import/order */
/**
 * 順序カラースケールを生成
 *
 * 連続値を単一の色相でグラデーション表示するカラースケールを生成します。
 */

import type { SequentialColorScaleOptions } from "../../types";
import { createColorSchemes } from './create-color-schemes';

/**
 * 順序カラースケールを生成
 *
 * @param options - 順序カラースケールのオプション
 * @returns 値から色への変換関数
 */
export async function createSequentialColorScale(
  options: SequentialColorScaleOptions
): Promise<(value: number) => string> {
  const {
    data,
    colorScheme = "interpolateBlues",
    isReversed = false,
    minValueType = 'data-min',
    noDataColor = "#e0e0e0",
    d3: providedD3,
  } = options;

  const d3Module = providedD3 || (await import("d3"));
  const d3 = (d3Module as any).default || d3Module;

  if (!data || data.length === 0) {
    return () => noDataColor;
  }

  const colorSchemes = createColorSchemes(d3);
  const interpolator = (t: number) => {
    const base = colorSchemes[colorScheme] || d3.interpolateBlues;
    return isReversed ? base(1 - t) : base(t);
  };

  const values = data.map((d) => d.value);
  const dataMinValue = d3.min(values) ?? 0;
  const maxValue = d3.max(values) ?? 0;
  const minValue = minValueType === 'zero' ? 0 : dataMinValue;
  const scale = d3.scaleSequential(interpolator).domain([minValue, maxValue]);

  return (value: number) => scale(value);
}
