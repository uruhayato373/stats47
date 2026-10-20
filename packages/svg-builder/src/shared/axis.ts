/**
 * 軸スケール・目盛り計算ユーティリティ
 */

import { formatValueWithPrecision } from "@stats47/utils";

export { niceScale, niceTicks, paddedRange, type NiceScale } from '@stats47/types';

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
 *
 * 丸めは `formatValueLabel` と同じ Intl.NumberFormat に揃える。`toFixed` は 2 進の値で丸めるため
 * 0.845 が "0.84" になり、本文や棒グラフのラベル ("0.85") と散布図のホバー表示が食い違っていた
 * (2026-10-07、fiscal-self-reliance-gap の神奈川県 0.845・千葉県 0.745)。
 */
const tickFormats = new Map<number, Intl.NumberFormat>();
export function formatTick(value: number, decimals = 2): string {
  if (value % 1 === 0) return String(value);
  let format = tickFormats.get(decimals);
  if (!format) {
    // 目盛りは末尾のゼロを出さない (旧 parseFloat と同じ) ので最小桁は 0。データセットで桁を揃える値ラベルとは別
    format = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals, useGrouping: false });
    tickFormats.set(decimals, format);
  }
  const text = format.format(value);
  return text === "-0" ? "0" : text;
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
 * 実体は `@stats47/utils` にある (apps/web のランキング表・ヘッダーと同じ実装を使う。
 * 桁揃えを共通化する作業で 2 か所に別実装を置くと本末転倒になる)。
 * ここは svg-builder 内の呼び出し元のための re-export。
 */
export { resolveValuePrecision } from "@stats47/utils";
