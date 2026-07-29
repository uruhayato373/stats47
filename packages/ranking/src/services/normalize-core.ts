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

/**
 * 正規化の分母に使う well-known metric の宣言。
 *
 * ★`valueScaleToBaseUnit` を必ず伴わせること。
 *
 * config の `NormalizationOption` は「基準単位あたり」で書かれている:
 *
 *   per_area        : `unit: "人/100km²"`, `scaleFactor: 100`    → 式は `分子 / 面積[km²] × 100`
 *   per_population  : `unit: "人/10万人"`, `scaleFactor: 100000` → 式は `分子 / 人口[人] × 100000`
 *
 * つまり scaleFactor は **分母が基準単位 (km² / 人) で来ること**を前提にしている。ところが
 * 分母 metric が R2 に保持している値の単位は e-Stat の公表単位そのままで、基準単位とは限らない。
 *
 * - `total-area-including-northern-territories-and-takeshima` の unit は **`１００Ｋm2` (= 100km²)**
 *   (実測: 北海道 834.21 = 83,421km² / 東京 22 = 2,200km²)
 * - よって素の値で割ると `分子 / (面積[km²] / 100) × 100` = `分子 / 面積[km²] × 10000` となり
 *   **意図した「100km² あたり」の 100 倍**になる
 *
 * `valueScaleToBaseUnit` は「R2 に入っている分母の値 → 基準単位」への変換係数で、この差を吸収する。
 * 新しい分母を追加するときは、その metric config の `unit` を確認して係数を必ず設定すること。
 */
export interface WellKnownDenominator {
  /** 分母として読む metric key */
  key: string;
  /** R2 の分母値に掛けると基準単位 (per_area→km² / per_population→人) になる係数 */
  valueScaleToBaseUnit: number;
}

export const WELL_KNOWN_DENOMINATORS: Record<
  string,
  Record<string, WellKnownDenominator>
> = {
  per_population: {
    // total-population の unit は「人」= 基準単位そのもの
    prefecture: { key: "total-population", valueScaleToBaseUnit: 1 },
    city: { key: "total-population", valueScaleToBaseUnit: 1 },
  },
  per_area: {
    // unit「１００Ｋm2」= 100km² 単位で格納されているため ×100 して km² に直す
    prefecture: {
      key: "total-area-including-northern-territories-and-takeshima",
      valueScaleToBaseUnit: 100,
    },
    // 市区町村の面積 metric は現状 registry に存在しない (この分岐は解決できず空を返す)。
    // 追加するときは必ずその config の unit を見て係数を設定すること。
    city: { key: "total-area", valueScaleToBaseUnit: 1 },
  },
};

/** 正規化 1 件を解くのに必要な分母の指定 */
export interface ResolvedDenominator {
  key: string;
  valueScaleToBaseUnit: number;
}

/**
 * 正規化 option から使うべき分母 (key + 単位換算係数) を決める。
 *
 * config が `denominatorKey` を明示している場合は**単位が不明**なため換算しない (係数 1)。
 * 現 registry には該当 0 件だが、将来足すときは分母の unit を確認すること。
 */
export function resolveDenominator(
  normType: string,
  areaType: string,
  denominatorKeyOverride?: string | null,
): ResolvedDenominator | null {
  if (denominatorKeyOverride) {
    return { key: denominatorKeyOverride, valueScaleToBaseUnit: 1 };
  }
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
