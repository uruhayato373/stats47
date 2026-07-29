/**
 * 正規化スナップショット + 全国時系列の**純関数コア** (I/O なし・テスト可能)。
 *
 * writer (`generate-ranking-normalized-values.ts`) はここを呼ぶだけで、
 * 実際の除算・単位換算は `services/normalize-core.ts` (runtime と共有) に委譲する。
 */
import { applyNormalization } from "../../services/normalize-core";

import type {
  NationalTrendBasis,
  NationalTrendPoint,
  NationalTrendSeries,
  RankingValuesKeySnapshot,
} from "../../types/snapshot";
import type { RankingValue } from "../../types";

/** 分母 1 年分 (areaCode → 値) */
export type DenominatorYearMap = ReadonlyMap<string, number | null>;

/** 分母 metric 全体 (yearCode → areaCode → 値) + フォールバック年 */
export interface DenominatorTable {
  byYear: ReadonlyMap<string, DenominatorYearMap>;
  /** 対象年に分母が無いときに使う年 (= 分母 metric の最新年) */
  latestYearCode: string | null;
}

/** 分母行から DenominatorTable を組む */
export function buildDenominatorTable(
  rows: readonly { areaCode: string; yearCode: string; value: number | null }[],
): DenominatorTable {
  const byYear = new Map<string, Map<string, number | null>>();
  for (const row of rows) {
    let m = byYear.get(row.yearCode);
    if (!m) {
      m = new Map();
      byYear.set(row.yearCode, m);
    }
    m.set(row.areaCode, row.value);
  }
  const years = [...byYear.keys()].sort();
  return { byYear, latestYearCode: years.length > 0 ? years[years.length - 1] : null };
}

/**
 * 対象年の分母を選ぶ。同年が無ければ分母 metric の最新年へフォールバックする
 * (runtime `computeNormalization` と同じ規則)。
 *
 * 総面積は 2023 年しか存在しないため、per_area は全年で 2023 の面積を分母にする。
 * 面積は年変動が極めて小さいので意図どおりの近似。
 */
export function selectDenominatorForYear(
  table: DenominatorTable,
  yearCode: string,
): { rows: { areaCode: string; value: number | null }[]; usedYearCode: string } | null {
  const exact = table.byYear.get(yearCode);
  if (exact && exact.size > 0) {
    return { rows: toRows(exact), usedYearCode: yearCode };
  }
  if (table.latestYearCode) {
    const fallback = table.byYear.get(table.latestYearCode);
    if (fallback && fallback.size > 0) {
      return { rows: toRows(fallback), usedYearCode: table.latestYearCode };
    }
  }
  return null;
}

function toRows(m: DenominatorYearMap): { areaCode: string; value: number | null }[] {
  return [...m.entries()].map(([areaCode, value]) => ({ areaCode, value }));
}

export interface BuildNormalizedPartitionsOptions {
  metricKey: string;
  unit: string;
  scaleFactor?: number;
  valueScaleToBaseUnit: number;
}

/**
 * 素の partitions (values.json 相当) を正規化した partitions に変換する。
 *
 * 各年ごとに分母を解決し、`applyNormalization` (runtime 共通コア) で除算 + rank 付与。
 * 分母が無い年 / 結果が空の年は partition ごと落とす。
 */
export function buildNormalizedPartitions(
  partitions: RankingValuesKeySnapshot["partitions"],
  denominator: DenominatorTable,
  options: BuildNormalizedPartitionsOptions,
): RankingValuesKeySnapshot["partitions"] {
  const out: RankingValuesKeySnapshot["partitions"] = [];

  for (const partition of partitions) {
    const den = selectDenominatorForYear(denominator, partition.yearCode);
    if (!den) continue;

    const values = applyNormalization(partition.values, den.rows, {
      metricKey: options.metricKey,
      unit: options.unit,
      scaleFactor: options.scaleFactor,
      valueScaleToBaseUnit: options.valueScaleToBaseUnit,
    });
    if (values.length === 0) continue;

    // 年は元の順 (降順) を保ち、partition 内は rank 昇順
    const sorted = [...values].sort((a, b) => a.rank - b.rank);
    out.push({ yearCode: partition.yearCode, count: sorted.length, values: sorted });
  }

  return out;
}

/**
 * 全国時系列の 1 series を作る。
 *
 * average は **47 県の単純算術平均**。areaCode "00000" (全国行) と null 値を除外する。
 * これは削除済み `computeYearlyAverages` および現行 `RankingHeroCard` の単年集計と同じ定義で、
 * UI の「全国平均」表示と時系列の意味を一致させるため。
 */
export function buildNationalTrendSeries(
  partitions: RankingValuesKeySnapshot["partitions"],
  basis: NationalTrendBasis,
  label: string,
  unit: string,
): NationalTrendSeries {
  const points: NationalTrendPoint[] = [];

  for (const partition of partitions) {
    let total = 0;
    let count = 0;
    let yearName = partition.yearCode;

    for (const v of partition.values as RankingValue[]) {
      if (v.areaCode === "00000") continue;
      if (v.value === null || !Number.isFinite(v.value)) continue;
      total += v.value;
      count++;
      if (v.yearName) yearName = v.yearName;
    }

    if (count === 0) continue;
    points.push({
      yearCode: partition.yearCode,
      yearName,
      average: total / count,
      total,
      count,
    });
  }

  // 年降順 (partitions と同じ並び) を保証
  points.sort((a, b) => b.yearCode.localeCompare(a.yearCode));

  return { basis, label, unit, points };
}

/** 正規化 option の label が無い場合の既定表示名 */
export const BASIS_LABELS: Record<NationalTrendBasis, string> = {
  original: "総数",
  per_population: "人口10万人あたり",
  per_area: "面積100km²あたり",
};
