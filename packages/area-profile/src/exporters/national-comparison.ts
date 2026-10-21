import type { JapanSeriesArtifact } from "@stats47/stats-r2";

/**
 * 県データブックの「全国」との対比値。
 *
 * 率や 1 人当たりの指標は、全国の値が 47 都道府県の単純平均と一致しない (2022 年度の有効求人倍率は
 * 全国 1.31 倍・単純平均 1.39 倍、2021 年度の 1 人当たり県民所得は全国 3,330 千円・単純平均 2,996 千円)。
 * 同じ年の公式の全国値 (`app/japan/<key>/series.json`) があればそれを使い、無ければ単純平均を
 * 「47都道府県平均」として出す (AREA-NATIONAL-AVG-SIMPLE-MEAN-01)。
 * 都道府県の合計から作った全国値 (`derived-additive`) は合計で平均ではないので使わない。
 */
export type NationalComparisonKind = "national" | "prefecture-mean";

const YEAR_DIGITS = 4;

export function resolveNationalComparison(
  prefectureValues: readonly number[],
  japan: Pick<JapanSeriesArtifact, "sourceMode" | "rows"> | null,
  yearCode: string,
): { value: number; kind: NationalComparisonKind } {
  const year = String(yearCode).slice(0, YEAR_DIGITS);
  if (japan && japan.sourceMode !== "derived-additive") {
    const row = japan.rows.find((r) => String(r.yearCode).slice(0, YEAR_DIGITS) === year);
    if (row && Number.isFinite(row.value)) return { value: row.value, kind: "national" };
  }
  const mean =
    prefectureValues.length > 0 ? prefectureValues.reduce((sum, v) => sum + v, 0) / prefectureValues.length : 0;
  return { value: mean, kind: "prefecture-mean" };
}
