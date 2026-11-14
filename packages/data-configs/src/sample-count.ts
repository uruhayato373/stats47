import type { SampleCountSpec } from './types';

/** 推計の人数を付けた行。`reference` の行は順位を持たず、ページでは参考値として別に示す */
export interface SampleCountedRow {
  areaCode: string;
  yearCode: string;
  value: number | null;
  sampleCount?: number | null;
  reference?: boolean;
}

/** 推計の人数の表の取得結果を引くキー (地域コード と 4 桁の年) */
export function sampleCountKey(areaCode: string, yearCode: string): string {
  return `${areaCode}|${String(yearCode).slice(0, 4)}`;
}

/**
 * 行に推計の人数を付け、`spec.minimum` 人未満の行を参考値 (`reference: true`) にする。
 *
 * - `counts` の値は表の単位のまま (賃金構造基本統計なら十人)。`spec.factor` を掛けて人にする
 * - 人数が取れない行 (表に無い・欠測) は `sampleCount: null` にし、参考値にしない
 *   (人数が分からないことを「少ない」と読み替えない)
 * - 値が欠測の行は参考値にしない (もともと順位も値も出ない)
 *
 * DATA-WAGE-TEACHER-COVERAGE-01 (2026-11-14 オーナー決定: 推計 10 人未満の県年は順位から外して参考値)。
 */
export function applySampleCounts<R extends SampleCountedRow>(
  rows: readonly R[],
  counts: ReadonlyMap<string, number | null>,
  spec: SampleCountSpec,
): R[] {
  return rows.map((row) => {
    const raw = counts.get(sampleCountKey(row.areaCode, row.yearCode));
    const sampleCount = raw == null ? null : Math.round(raw * spec.factor);
    const reference = row.value != null && sampleCount != null && sampleCount < spec.minimum;
    return reference ? { ...row, sampleCount, reference: true } : { ...row, sampleCount };
  });
}
