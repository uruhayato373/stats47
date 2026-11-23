/**
 * 年ごとの県別の値を、県の並び (PREFECTURE_AREA_CODES の順) の数値配列で持つ。
 * 相関はペアごとに両方に値のある最新の共通年で計算するので、指標ごとに全年を保持する
 * (CORRELATION-SNAPSHOT-YEAR-ALIGN-01。2026-10-09 に農業産出額 2024 年と農業就業人口 2014 年を組んでいた)。
 * 行の object と Map で全年を持つと 2,000 指標 × 数十年で heap を圧迫するため、値の無い県を NaN にした配列にする。
 */
import { PREFECTURE_AREA_CODES } from '@stats47/area';

import { toAverageRanks, type MatchedPearsonResult } from './calculate-pearson';

export const AREA_CODES: readonly string[] = PREFECTURE_AREA_CODES;
const AREA_INDEX = new Map(AREA_CODES.map((code, i) => [code, i]));

export interface YearSlice {
  /** 県の並びの値。値の無い県は NaN */
  values: Float64Array;
  /** 値のある県の数 */
  count: number;
  /** 同値は平均順位にした順位 (値の無い県は NaN)。初めて使うときに作る */
  ranks?: Float64Array;
}

export interface YearSeries {
  /** 値のある県が minPoints 以上の年 (新しい順) */
  years: string[];
  slices: Map<string, YearSlice>;
}

/**
 * 観測値の行から年ごとの配列を作る。47 都道府県以外の地域コードは捨てる。
 * includeYear で config.years の範囲に絞り、値のある県が minPoints 未満の年は持たない。
 */
export function buildYearSeries(
  rows: Iterable<{ areaCode: string; yearCode: string; value: number | null | undefined }>,
  includeYear: (yearCode: string) => boolean,
  minPoints: number
): YearSeries {
  const slices = new Map<string, YearSlice>();
  for (const row of rows) {
    if (row.value === null || row.value === undefined || !Number.isFinite(row.value)) continue;
    const index = AREA_INDEX.get(row.areaCode);
    if (index === undefined || !includeYear(row.yearCode)) continue;
    let slice = slices.get(row.yearCode);
    if (!slice) {
      slice = { values: new Float64Array(AREA_CODES.length).fill(NaN), count: 0 };
      slices.set(row.yearCode, slice);
    }
    if (Number.isNaN(slice.values[index])) slice.count++;
    slice.values[index] = row.value;
  }
  for (const [year, slice] of slices) if (slice.count < minPoints) slices.delete(year);
  const years = [...slices.keys()].sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  return { years, slices };
}

/** 両方に値のある県だけで Pearson の r を出す (calculateMatchedPearsonR と同じ式)。 */
export function pairedPearsonR(a: Float64Array, b: Float64Array): MatchedPearsonResult {
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    count++;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  if (count < 2) return { r: 0, count };
  const numerator = count * sumXY - sumX * sumY;
  const denominator = Math.sqrt((count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY));
  if (denominator === 0) return { r: 0, count };
  return { r: Math.max(-1, Math.min(1, numerator / denominator)), count };
}

/** その年の値を県ごとの順位にした配列 (値のある県だけで順位を付ける)。 */
export function ranksOf(slice: YearSlice): Float64Array {
  if (slice.ranks) return slice.ranks;
  const present: number[] = [];
  for (let i = 0; i < slice.values.length; i++) if (!Number.isNaN(slice.values[i])) present.push(i);
  const averaged = toAverageRanks(present.map((i) => slice.values[i]));
  const ranks = new Float64Array(slice.values.length).fill(NaN);
  present.forEach((areaIndex, k) => {
    ranks[areaIndex] = averaged[k];
  });
  slice.ranks = ranks;
  return ranks;
}

/**
 * 両方に値のある最新の共通年。x の年を新しい順に見て、y にもあり両方に値のある県が minPoints 以上の最初の年を返す。
 * 共通年が無ければ null (そのペアは相関を出さない)。
 */
export function latestCommonYear(
  x: YearSeries,
  y: YearSeries,
  minPoints: number
): { year: string; matched: MatchedPearsonResult } | null {
  for (const year of x.years) {
    const ys = y.slices.get(year);
    if (!ys) continue;
    const matched = pairedPearsonR(x.slices.get(year)!.values, ys.values);
    if (matched.count >= minPoints) return { year, matched };
  }
  return null;
}
