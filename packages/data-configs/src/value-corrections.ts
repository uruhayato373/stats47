import type { ValueCorrection } from './types';

interface CorrectableRow {
  areaCode: string;
  yearCode: string;
  value: number | null;
}

/**
 * 統計表の誤りを公表値へ置き換える。`sourceValue` と食い違う行があれば止める
 * (元の表が訂正されたときに、古い補正を残したまま取り込まないため)。
 */
export function applyValueCorrections<R extends CorrectableRow>(
  metricKey: string,
  rows: readonly R[],
  corrections: readonly ValueCorrection[],
): R[] {
  const corrected = [...rows];
  for (const c of corrections) {
    const index = corrected.findIndex(
      (r) => r.areaCode === c.areaCode && r.yearCode === String(c.year),
    );
    if (index < 0) {
      throw new Error(`${metricKey}: 補正先の行が無い ${c.areaCode} ${c.year}`);
    }
    const row = corrected[index];
    if (row.value !== c.sourceValue) {
      throw new Error(
        `${metricKey}: ${c.areaCode} ${c.year} の元の値が ${row.value} で、補正の前提 ${c.sourceValue} と違う。補正を見直す`,
      );
    }
    corrected[index] = { ...row, value: c.value };
  }
  return corrected;
}
