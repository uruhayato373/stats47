/**
 * 正規化 (per_population / per_area) の**純関数コア**。
 *
 * ここが runtime (`compute-normalization.ts`) と事前生成 writer
 * (`scripts/generate-ranking-normalized-values.ts`) の**唯一の計算実装**。
 *
 * ## なぜ切り出したか (2026-07-29 の 100 倍過大バグの恒久対策)
 *
 * 旧構成では runtime と exporter が同じ計算を**別々に実装**しており、分母の単位換算が
 * exporter 側だけ欠落して R2 の `values-per-area.json` が 100 倍過大になっていた
 * (実測: 東京 2015 が 61,433,050 人/100km²、正しくは 614,330)。片方だけ直しても
 * もう片方がドリフトする構造だったため、計算を 1 ファイルに集約して物理的に分岐不能にする。
 *
 * I/O を持たない (logger / repository / R2 に依存しない) ので、Node スクリプトからも
 * Server Component からも同じものを import できる。
 */
import { computeCalculatedValues } from "../utils/compute-calculated-values";
import { rankByValue } from "../utils/rank-by-value";

import type { RankingValue } from "../types";

import { WELL_KNOWN_DENOMINATORS } from "@stats47/data-configs";
/** 正規化 1 件を解くのに必要な分母の指定 */
export interface ResolvedDenominator {
  key: string;
  valueScaleToBaseUnit: number;
}

/** The authored normalization denominator selects both metric ID and unit scale. */
export function resolveDenominator(
  normType: string,
  areaType: string,
): ResolvedDenominator | null {
  const wellKnown = WELL_KNOWN_DENOMINATORS[normType]?.[areaType];
  if (!wellKnown) return null;
  return { key: wellKnown.key, valueScaleToBaseUnit: wellKnown.valueScaleToBaseUnit };
}

/** 分母行 (rank を持たない R2 stats 行でも受けられるよう最小形) */
export interface DenominatorRow {
  areaCode: string;
  value: number | null;
}

export interface ApplyNormalizationOptions {
  /** 結果の metricKey (= 分子の ranking key) */
  metricKey: string;
  /** 結果の単位 (config の option.unit) */
  unit: string;
  /** config の option.scaleFactor (分母が基準単位で来る前提の係数)。未指定は 1 */
  scaleFactor?: number;
  /** 分母を基準単位へ直す係数 (resolveDenominator の戻り値) */
  valueScaleToBaseUnit: number;
}

/**
 * 分子 × 分母 → 正規化済みランキング値 (rank 付き) を返す純関数。
 *
 * 手順は 1 つだけ: **分母を基準単位へ換算してから** `分子 / 分母 × scaleFactor` を取る。
 * 換算を飛ばすと 100 倍過大バグが再発する (§冒頭)。
 *
 * 分母が null / 0 以下の地域は結果に含めない (0 除算・負値の順位混入を防ぐ)。
 */
export function applyNormalization<T extends { areaCode?: string | null; value: number | null }>(
  numeratorValues: T[],
  denominatorValues: readonly DenominatorRow[],
  options: ApplyNormalizationOptions,
): RankingValue[] {
  const scaled = denominatorValues
    .filter((d) => d.value !== null && d.value > 0)
    .map((d) => ({
      areaCode: d.areaCode,
      value: (d.value as number) * options.valueScaleToBaseUnit,
    }));

  const computed = computeCalculatedValues(
    numeratorValues as never,
    scaled as never,
    {
      type: "ratio",
      metricKey: options.metricKey,
      unit: options.unit,
      keyBy: "areaCode",
      scaleFactor: options.scaleFactor ?? 1,
    },
  );

  return rankByValue(computed) as RankingValue[];
}
