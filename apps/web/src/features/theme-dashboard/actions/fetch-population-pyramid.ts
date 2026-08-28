"use server";

import {
  PYRAMID_AGE_GROUPS,
  enumeratePyramidCategoryCodes,
  type StatSeriesRef,
} from "@stats47/data-configs/theme-catalog";
import { readStatsValues } from "@stats47/stats-r2/readers";

import type { PyramidChartData } from "@stats47/visualization/d3";

export interface PopulationPyramidResult {
  pyramidData: PyramidChartData[];
  yearName: string;
}

type PyramidSeries = {
  metricKey: string;
  rows: Array<{
    areaCode: string;
    yearCode: string;
    yearName: string;
    value: number | null;
    unit?: string;
  }>;
};

/**
 * MetricConfig から生成済みの R2 系列だけを使って人口ピラミッドを組み立てる。
 * 34系列に共通する最新年が無い場合や、1系列でも欠測なら0埋めせず no-data にする。
 */
export async function fetchPopulationPyramidAction(
  prefCode: string,
  seriesRefs: readonly StatSeriesRef[],
): Promise<PopulationPyramidResult | null> {
  const expected = enumeratePyramidCategoryCodes();
  const expectedKeys = new Set(expected.map(({ metricKey }) => metricKey));
  const actualKeys = new Set(seriesRefs.map(({ metricKey }) => metricKey));
  if (
    seriesRefs.length !== expected.length ||
    actualKeys.size !== expectedKeys.size ||
    [...expectedKeys].some((key) => !actualKeys.has(key))
  ) {
    return null;
  }

  const results = await Promise.all(
    seriesRefs.map(async (ref): Promise<PyramidSeries | null> => {
      const payload = await readStatsValues(ref.metricKey, "prefecture");
      if (!payload) return null;
      const rows = payload.rows.filter(
        (row) =>
          row.areaCode === prefCode &&
          row.value !== null &&
          row.unit === "人" &&
          (ref.year === undefined || row.yearCode === ref.year),
      );
      return rows.length > 0 ? { metricKey: ref.metricKey, rows } : null;
    }),
  );
  if (results.some((result) => result === null)) return null;

  const series = results as PyramidSeries[];
  const [firstYears, ...remainingYears] = series.map(
    ({ rows }) => new Set(rows.map(({ yearCode }) => yearCode)),
  );
  if (!firstYears) return null;
  const commonYears = remainingYears.reduce<Set<string>>(
    (intersection, years) =>
      new Set([...intersection].filter((year) => years.has(year))),
    new Set(firstYears),
  );
  const yearCode = [...commonYears].sort().at(-1);
  if (!yearCode) return null;

  const valuesByMetric = new Map(
    series.map(({ metricKey, rows }) => [
      metricKey,
      rows.find((row) => row.yearCode === yearCode),
    ]),
  );
  if ([...valuesByMetric.values()].some((row) => row?.value == null)) return null;

  const pyramidData: PyramidChartData[] = PYRAMID_AGE_GROUPS.map((ageGroup) => {
    const maleKey = expected.find(
      ({ label, sex }) => label === ageGroup.label && sex === "male",
    )?.metricKey;
    const femaleKey = expected.find(
      ({ label, sex }) => label === ageGroup.label && sex === "female",
    )?.metricKey;
    const male = maleKey ? valuesByMetric.get(maleKey)?.value : null;
    const female = femaleKey ? valuesByMetric.get(femaleKey)?.value : null;
    if (male == null || female == null) {
      throw new Error(`人口ピラミッド系列が不足しています: ${ageGroup.label}`);
    }
    return {
      ageGroup: ageGroup.label,
      male: -Math.abs(male),
      female: Math.abs(female),
    };
  });

  const yearName = series[0]?.rows.find((row) => row.yearCode === yearCode)?.yearName;
  return { pyramidData, yearName: yearName || yearCode };
}
