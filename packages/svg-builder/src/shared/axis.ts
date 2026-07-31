/**
 * 軸スケール・目盛り計算ユーティリティ
 */

import { formatValueWithPrecision, getMaxDecimalPlaces } from "@stats47/utils";

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

/**
 * 値ラベル表示用フォーマット（整数部を 3 桁カンマ区切り・**小数桁は固定**）。
 *
 * ## 桁数はデータセット単位で揃える (2026-07-31)
 *
 * 以前は `maximumFractionDigits` だけを指定していたため、同じ図の中で
 * `60.4` と `44` が混ざり、読み比べにくかった。**桁数は 1 つの値では決まらず、
 * データセット全体で決まる**ので、呼び出し側が `resolveValuePrecision(values)` で
 * 1 度解決し、その値を全ラベルに使う。
 *
 * 実装は `@stats47/utils` の確立した組 (`getMaxDecimalPlaces` +
 * `formatValueWithPrecision`) に委譲する。Remotion / visualization も同じ組を使っており、
 * svg-builder だけが独自実装だった。
 *
 * 例 (precision=1): 110700 → "110,700.0" / 4.63 → "4.6" / 44 → "44.0"
 * 例 (precision=0): 110700 → "110,700" / 44 → "44"
 */
export function formatValueLabel(value: number, decimals = 1): string {
  return formatValueWithPrecision(value, decimals);
}

/**
 * データセット全体で揃える小数桁を決める。**図を描く前に 1 度だけ呼ぶ。**
 *
 * 実データは 44.0 を 44 として持つ (JSON の number なので区別できない) ため、
 * 「そのデータセットに現れる最大の小数桁」を採る。1 県でも 60.4 があれば
 * その指標は小数第1位まで意味があるので、44 も "44.0" と表示する。
 *
 * @param maxDecimals 上限 (既定 2)。桁が多すぎるとラベルが読めなくなるため
 */
export function resolveValuePrecision(
  values: readonly number[],
  maxDecimals = 2,
): number {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return 0;
  return Math.min(getMaxDecimalPlaces(finite as number[]), maxDecimals);
}
