/**
 * 発散カラースケールを生成
 *
 * 中間点を基準に正負を2つの色相で表示するカラースケールを生成します。
 */

import { calculateMidpoint } from './calculate-midpoint';
import { resolveColorInterpolator } from './create-color-schemes';

import type { DivergingColorScaleOptions } from "../../types";

/**
 * 発散カラースケールを生成
 *
 * @param options - 発散カラースケールのオプション
 * @returns 値から色への変換関数
 */
export async function createDivergingColorScale(
  options: DivergingColorScaleOptions
): Promise<(value: number) => string> {
  const {
    data,
    colorScheme = "interpolateRdBu",
    isReversed = false,
    divergingMidpoint,
    divergingMidpointValue,
    isSymmetrized = false,
    noDataColor = "#e0e0e0",
    d3: providedD3,
  } = options;

  const d3Module = providedD3 || (await import("d3"));
  const d3 = (d3Module as any).default || d3Module;

  if (!data || data.length === 0) {
    return () => noDataColor;
  }

  const base = resolveColorInterpolator(d3, colorScheme, "interpolateRdBu");
  const interpolator = (t: number) => {
    return isReversed ? base(1 - t) : base(t);
  };

  const values = data.map((d) => d.value);
  const dataMinValue = d3.min(values) ?? 0;
  const maxValue = d3.max(values) ?? 0;
  const midpoint = calculateMidpoint(data as any, divergingMidpoint, divergingMidpointValue, d3);

  let domainMin = dataMinValue;
  let domainMax = maxValue;

  if (isSymmetrized) {
    const maxAbs = Math.max(
      Math.abs(dataMinValue - midpoint),
      Math.abs(maxValue - midpoint)
    );
    domainMin = midpoint - maxAbs;
    domainMax = midpoint + maxAbs;
  }

  const scale = d3.scaleDiverging(interpolator).domain([domainMin, midpoint, domainMax]);

  return (value: number) => scale(value);
}
