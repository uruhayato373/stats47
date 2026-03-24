/**
 * 軸スケール・目盛り計算ユーティリティ
 */

export interface NiceScale {
  max: number;
  step: number;
}

/**
 * データの最大値から「きりのよい」スケール上限と目盛り間隔を計算する
 */
export function niceScale(maxVal: number, maxTicks = 8): NiceScale {
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * magnitude);
  const step = candidates.find((c) => maxVal / c <= maxTicks) ?? candidates[candidates.length - 1];
  const max = Math.ceil(maxVal / step) * step;
  return { max, step };
}

/**
 * 軸の範囲 [lo, hi] に対して、最大 targetCount 個の目盛り値を返す
 */
export function niceTicks(lo: number, hi: number, targetCount = 5): number[] {
  const range = hi - lo;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range / targetCount)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * magnitude);
  const step = candidates.find((c) => range / c <= targetCount + 1) ?? candidates[candidates.length - 1];
  const start = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 0.01; v += step) {
    ticks.push(parseFloat(v.toFixed(10)));
  }
  return ticks;
}

/**
 * データ範囲にパディングを加えた [lo, hi] を返す（散布図の軸余白用）
 */
export function paddedRange(
  values: number[],
  paddingRatio = 0.05,
): { lo: number; hi: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * paddingRatio;
  return { lo: min - pad, hi: max + pad };
}

/**
 * データ値を SVG 座標に変換するリニアスケールを生成する
 */
export function linearScale(
  domainLo: number,
  domainHi: number,
  rangeLo: number,
  rangeHi: number,
): (value: number) => number {
  return (v) => rangeLo + ((v - domainLo) / (domainHi - domainLo)) * (rangeHi - rangeLo);
}

/**
 * 値を指定した小数点桁数でフォーマットする（末尾ゼロを除く）
 */
export function formatTick(value: number, decimals = 2): string {
  if (value % 1 === 0) return String(value);
  return parseFloat(value.toFixed(decimals)).toString();
}
