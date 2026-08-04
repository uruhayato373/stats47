import { NATIONAL_AREA_CODE } from "./select-national-series";

/** 年次系列の 1 点 */
export interface MetricTimeseriesPoint {
  year: string;
  yearName: string;
  value: number;
}

/**
 * 値の出所。呼び出し側が「全国」と「全国平均」を言い分けるために使う。
 *
 * - `national` … 全ての点が e-Stat の全国行 (areaCode 00000) 由来 = 真の全国値
 * - `average`  … 1 点でも 47 県平均が混ざる (全国行を持たない統計表・年がある)
 * - `area`     … 特定都道府県の系列
 * - `none`     … データなし (計算型・取得失敗を含む)
 *
 * ★`average` を「全国」と表示してはならない。総人口のような実数系は 1/47 の値になり、
 *   率系も人口で加重されないため全国値と一致しない (2026-08-04 の不具合)。
 */
export type MetricTimeseriesSource = "national" | "average" | "area" | "none";

export interface MetricTimeseriesResult {
  points: MetricTimeseriesPoint[];
  source: MetricTimeseriesSource;
}

export const EMPTY_TIMESERIES: MetricTimeseriesResult = { points: [], source: "none" };

/**
 * 集約が必要とする最小の行形。e-Stat の生応答と R2 正典 (StatsValuesPayload.rows) の
 * 共通部分だけを見ることで、どちらから来ても同じ集約ロジックを通せる。
 */
export interface TimeseriesSourceRow {
  areaCode: string;
  yearCode: string;
  yearName?: string | null;
  value: number | null;
}

/**
 * 観測行を年次系列へ集約する。
 *
 * 全国 (00000) 要求時は e-Stat の全国行を最優先し、その年に全国行が無いときだけ
 * 47 県平均で埋める。1 点でも平均が混ざった系列は `average` と申告して、
 * 呼び出し側が「全国」と言い切らないようにする。
 */
export function aggregateMetricTimeseries(
  rawData: TimeseriesSourceRow[],
  areaCode: string,
): MetricTimeseriesResult {
  if (!rawData || rawData.length === 0) return EMPTY_TIMESERIES;

  const isNational = areaCode === NATIONAL_AREA_CODE;

  const byYear = new Map<
    string,
    { yearName: string; values: number[]; nationalValue: number | null }
  >();
  for (const d of rawData) {
    if (typeof d.value !== "number" || !Number.isFinite(d.value)) continue;
    const entry = byYear.get(d.yearCode) ?? {
      yearName: d.yearName ?? d.yearCode,
      values: [],
      nationalValue: null,
    };
    if (d.areaCode === NATIONAL_AREA_CODE) {
      entry.nationalValue = d.value;
    } else if (d.areaCode === areaCode) {
      // 特定県の値
      entry.values.push(d.value);
    } else if (isNational) {
      // 全国モード: 47 県の値を集約 (平均算出用)
      entry.values.push(d.value);
    }
    byYear.set(d.yearCode, entry);
  }

  const points: MetricTimeseriesPoint[] = [];
  let averagedPoints = 0;
  for (const [yearCode, entry] of byYear.entries()) {
    let value: number | null = null;
    if (isNational) {
      if (entry.nationalValue !== null) value = entry.nationalValue;
      else if (entry.values.length > 0) {
        value = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
        averagedPoints++;
      }
    } else if (entry.values.length === 1) {
      value = entry.values[0];
    }
    if (value === null) continue;
    points.push({ year: yearCode, yearName: entry.yearName, value });
  }

  if (points.length === 0) return EMPTY_TIMESERIES;
  points.sort((a, b) => a.year.localeCompare(b.year));

  const source: MetricTimeseriesSource = !isNational
    ? "area"
    : averagedPoints > 0
      ? "average"
      : "national";
  return { points, source };
}
