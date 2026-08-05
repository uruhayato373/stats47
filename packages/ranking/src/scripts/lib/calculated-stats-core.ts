/**
 * 計算型 metric (`fetcherKey:"calculated"`) の正典 `app/stats/<key>/values.json` を
 * 分子・分母から導出する純関数。
 *
 * ## なぜ要るか
 *
 * 2026-08-05 まで、この 3 metric (家賃控除後可処分所得 / 実質可処分所得 / エンゲル係数) の
 * `app/stats` を書く工程は**どのパイプラインにも存在しなかった**。
 * `page-data-batch` は `kind:"external"` を skip し、`generate-ranking-values` は
 * `app/stats` を `app/ranking` へ射影するだけ。ランタイムの `calculateRankingValues` は
 * あるが R2 へ書く呼び出し元が無い。結果として配信値は単発実行の産物で、分子・分母を
 * 更新しても追従せず、3 件の状態が揃っていなかった (1 年 / 1 年 / 18 年)。
 *
 * ## 設計原則: 取り込みと同じ契約・監査と同じ導出
 *
 * 行の形・rank 規則・ソート順は `page-data-batch.ts` に合わせる (別実装で微妙に違う
 * payload を作らない)。期待年集合は `expectedCalculatedYears` を generator と監査 (m) が
 * **同じ関数で**導出する。手選びのコピーを作らないので片方だけ更新して食い違わない
 * (`shape-gate.ts` / `recipe.ts` と同じパターン)。
 */

import type { MetricConfig } from "@stats47/data-configs";
import type { SingleEntityRow, StatsValuesPayload } from "@stats47/stats-r2";

import { periodScales, roundToPlaces } from "../../utils/period-align";
import type { CalculationConfig } from "../../types/ranking-item";

/** 全国行。県ランキングには入れない (page-data-batch も 47 県だけを書く) */
const NATIONAL_AREA_CODE = "00000";

export interface DeriveInput {
  config: MetricConfig;
  numeratorRows: readonly SingleEntityRow[];
  denominatorRows: readonly SingleEntityRow[];
}

export class CalculatedStatsError extends Error {}

/**
 * `config.years` の範囲判定。`page-data-batch.ts` の `inYearRange` と同一規則
 * (フルタイムコード混入を 4 桁へ正規化する防御も含む)。
 */
export function inYearRange(yearCode: string, config: MetricConfig): boolean {
  const y = Number(yearCode);
  if (!Number.isFinite(y)) return false;
  const spec = config.years;
  if (spec === "all" || spec == null) return true;
  const to4 = (n: number): number => (n > 9999 ? Number(String(n).slice(0, 4)) : n);
  if ("years" in spec) return spec.years.map(to4).includes(y);
  return y >= to4(spec.from) && y <= to4(spec.to);
}

/**
 * 計算結果が持つべき年集合 = 分子と分母の積集合 ∩ config.years。
 *
 * ★generator と監査 (m) が共有する。「作れるはずの年」の定義が 1 つしかないので、
 * 監査が「stale」と言ったら generator を回せば必ず解消する関係が保たれる。
 */
export function expectedCalculatedYears(
  config: MetricConfig,
  numeratorYears: Iterable<string>,
  denominatorYears: Iterable<string>,
): string[] {
  const den = new Set(denominatorYears);
  const out = new Set<string>();
  for (const y of numeratorYears) {
    if (den.has(y) && inYearRange(y, config)) out.add(y);
  }
  return [...out].sort();
}

/** 年ごとに value 降順で rank 付与。null は rank null、同値は同順位 (page-data-batch と同一) */
function assignRanks(rows: SingleEntityRow[]): void {
  const byYear = new Map<string, SingleEntityRow[]>();
  for (const r of rows) {
    const group = byYear.get(r.yearCode);
    if (group) group.push(r);
    else byYear.set(r.yearCode, [r]);
  }
  for (const group of byYear.values()) {
    const ranked = group
      .filter((r) => r.value != null)
      .sort((a, b) => (b.value as number) - (a.value as number));
    let prevValue: number | null = null;
    let prevRank = 0;
    ranked.forEach((r, i) => {
      if (prevValue !== null && r.value === prevValue) {
        r.rank = prevRank;
      } else {
        r.rank = i + 1;
        prevRank = i + 1;
        prevValue = r.value;
      }
    });
  }
}

function calculationOf(config: MetricConfig): NonNullable<MetricConfig["calculation"]> {
  const c = config.calculation;
  if (!c?.isCalculated) {
    throw new CalculatedStatsError(`${config.key}: calculation.isCalculated が true でない`);
  }
  return c;
}

/**
 * 分子・分母から計算行を導出する。
 *
 * 欠損 (片側に行が無い / value が null) はその行を落とす。**0 行になったら throw** して
 * 呼び元に書かせない — 空を書くと R2 の既存データを空で上書きしてしまう
 * (「壊れていたら書かない」= 既存温存が page-data-batch から続く規律)。
 */
export function deriveCalculatedRows({
  config,
  numeratorRows,
  denominatorRows,
}: DeriveInput): SingleEntityRow[] {
  const calc = calculationOf(config);
  const type = calc.type ?? calc.calculationType;
  if (type !== "ratio" && type !== "per_capita" && type !== "subtraction") {
    throw new CalculatedStatsError(`${config.key}: 実行できる calculation.type がない (${String(type)})`);
  }

  const { numeratorScale, denominatorScale } = periodScales(
    calc.periodAlign as CalculationConfig["periodAlign"],
  );
  const scaleFactor = calc.scaleFactor ?? 1;
  const decimalPlaces = config.display?.decimalPlaces;

  const denByKey = new Map<string, SingleEntityRow>();
  for (const r of denominatorRows) {
    if (r.areaCode === NATIONAL_AREA_CODE) continue;
    denByKey.set(`${r.yearCode}_${r.areaCode}`, r);
  }

  const rows: SingleEntityRow[] = [];
  for (const num of numeratorRows) {
    if (num.areaCode === NATIONAL_AREA_CODE) continue;
    if (!inYearRange(num.yearCode, config)) continue;

    const den = denByKey.get(`${num.yearCode}_${num.areaCode}`);
    if (!den) continue;
    if (num.value == null || den.value == null) continue;

    const n = num.value * numeratorScale;
    const d = den.value * denominatorScale;
    if ((type === "ratio" || type === "per_capita") && d === 0) continue;

    const raw = type === "subtraction" ? (n - d) * scaleFactor : (n / d) * scaleFactor;
    if (!Number.isFinite(raw)) {
      // NaN / Infinity は読み側 (parseStatsValues) が throw するので書く前に止める
      throw new CalculatedStatsError(
        `${config.key}: ${num.yearCode}/${num.areaCode} が有限数にならない (num=${num.value} den=${den.value})`,
      );
    }

    rows.push({
      areaCode: num.areaCode,
      areaName: num.areaName,
      yearCode: num.yearCode,
      yearName: num.yearName,
      value: roundToPlaces(raw, decimalPlaces),
      unit: config.unit,
      rank: null,
    });
  }

  if (rows.length === 0) {
    throw new CalculatedStatsError(
      `${config.key}: 計算できた行が 0 (分子 ${numeratorRows.length} 行 / 分母 ${denominatorRows.length} 行)`,
    );
  }

  assignRanks(rows);
  // page-data-batch と同じ並び (yearCode 昇順 → areaCode 昇順)
  rows.sort((a, b) =>
    a.yearCode === b.yearCode
      ? a.areaCode.localeCompare(b.areaCode)
      : a.yearCode.localeCompare(b.yearCode),
  );
  return rows;
}

/** 行から payload の meta を組む (recipe は呼び元が buildRecipe で作って渡す) */
export function buildCalculatedPayload(
  config: MetricConfig,
  rows: SingleEntityRow[],
  recipe: NonNullable<StatsValuesPayload["meta"]>["recipe"],
  generatedAt: string,
): StatsValuesPayload {
  const years = rows.map((r) => r.yearCode).sort();
  return {
    metricKey: config.key,
    entityKind: "prefecture",
    rows,
    meta: {
      rowCount: rows.length,
      yearRange: years.length > 0 ? [years[0], years[years.length - 1]] : null,
      areaCount: new Set(rows.map((r) => r.areaCode)).size,
      generatedAt,
      recipe,
    },
  };
}
