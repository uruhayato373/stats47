import type { StatsSchema } from "@stats47/types";

/** e-Stat の全国行の地域コード */
export const NATIONAL_AREA_CODE = "00000";

/** 都道府県コード (01000〜47000) */
const PREFECTURE_CODE_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

/**
 * 「全国」として描画すべき系列を選ぶ。
 *
 * ★e-Stat の統計表は全国行 (areaCode "00000") を持つ (実測 2026-08-04: 総人口 2024 年 =
 *   123,802,000 人)。これを捨てて 47 都道府県の単純平均を「全国」として描画すると、
 *   総人口・出生数のような実数系は 1/47 の値になり (/themes/population-dynamics が
 *   2,634,106 人と表示していた)、率系も人口で加重されないため全国値と一致しない
 *   (高齢化率 2024: 全国 29.3% ≠ 県平均)。
 *
 * したがって全国行があれば必ずそれを使い、持たない統計表に限り平均へフォールバックする。
 * フォールバックした系列は `areaName` を「全国平均」にして、呼び出し側が
 * 「全国」と言い切らないようにする。
 */
export function selectNationalSeries(allData: StatsSchema[]): StatsSchema[] | null {
  const nationalData = allData.filter((d) => d.areaCode === NATIONAL_AREA_CODE);
  if (nationalData.length > 0) return nationalData;

  const prefData = allData.filter((d) => PREFECTURE_CODE_RE.test(d.areaCode));

  const byYear = new Map<
    string,
    { values: number[]; yearName: string; metricKey: string; unit: string }
  >();
  for (const d of prefData) {
    const entry = byYear.get(d.yearCode);
    if (entry) {
      entry.values.push(d.value ?? 0);
    } else {
      byYear.set(d.yearCode, {
        values: [d.value ?? 0],
        yearName: d.yearName,
        metricKey: d.metricKey,
        unit: d.unit,
      });
    }
  }

  const averaged: StatsSchema[] = [];
  for (const [yearCode, entry] of byYear) {
    const avg = entry.values.reduce((a, b) => a + b, 0) / entry.values.length;
    averaged.push({
      areaCode: NATIONAL_AREA_CODE,
      areaName: "全国平均",
      yearCode,
      yearName: entry.yearName,
      metricKey: entry.metricKey,
      value: Math.round(avg * 100) / 100,
      unit: entry.unit,
    });
  }

  return averaged.length > 0 ? averaged : null;
}
