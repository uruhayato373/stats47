import { resolveNumericDomain } from './numeric-domain';
export interface NiceScale {
  max: number;
  step: number;
}

/**
 * データの最大値から「きりのよい」スケール上限と目盛り間隔を計算する
 */
export function niceScale(maxVal: number, maxTicks = 8): NiceScale {
  if (!Number.isFinite(maxVal) || !Number.isFinite(maxTicks) || maxTicks <= 0)
    throw new Error('Invalid nice scale input');
  if (maxVal <= 0) return { max: 1, step: 1 };
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * magnitude);
  const step =
    candidates.find((c) => maxVal / c <= maxTicks) ??
    candidates[candidates.length - 1];
  const max = Math.ceil(maxVal / step) * step;
  return { max, step };
}

/**
 * 軸の範囲 [lo, hi] に対して、最大 targetCount 個の目盛り値を返す
 */
export function niceTicks(lo: number, hi: number, targetCount = 5): number[] {
  if (
    !Number.isFinite(lo) ||
    !Number.isFinite(hi) ||
    hi <= lo ||
    targetCount <= 0
  )
    return [];
  const range = hi - lo;
  const magnitude = Math.pow(10, Math.floor(Math.log10(range / targetCount)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * magnitude);
  const step =
    candidates.find((c) => range / c <= targetCount + 1) ??
    candidates[candidates.length - 1];
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
  paddingRatio = 0.05
): { lo: number; hi: number } {
  const domain = resolveNumericDomain(values, {
    mode: 'extent',
    padding: paddingRatio,
  });
  if (!domain) throw new Error('No finite observations for padded range');
  return { lo: domain[0], hi: domain[1] };
}
