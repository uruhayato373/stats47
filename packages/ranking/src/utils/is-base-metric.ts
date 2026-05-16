import type { CalculationConfig } from "../types/ranking-item";

/**
 * ベース指標（正規化派生を自動付与する対象）かを判定する
 *
 * 「ベース」とは、絶対量を表すメトリクスで、人口/面積/世帯数で割って
 * 派生指標を作る価値があるもの。以下は除外:
 *
 * 1. 物理派生メトリクス: key !== group_key（既に別 metric として派生登録済み）
 * 2. 分母として使うメトリクス: total-population*, total-area*, households, general-households
 * 3. 既に計算ロジックを持つメトリクス: calculation.type が ratio/per_capita/subtraction
 * 4. 単位が比率系 (%, ‰)
 * 5. キー名が派生を示唆する suffix を持つ (per-, -rate, -ratio, -percentage 等)
 */
export interface IsBaseMetricInput {
  key: string;
  unit: string;
  groupKey?: string | null;
  calculation?: Pick<CalculationConfig, "type"> | null;
}

const DENOMINATOR_KEYS = new Set([
  "total-population",
  "total-population-male",
  "total-population-female",
  "total-area",
  "total-area-including-northern-territories-and-takeshima",
  "total-area-excluding-northern-territories-and-takeshima",
  "habitable-area",
  "habitable-land-area",
  "households",
  "general-households",
  "private-households",
]);

const DERIVED_KEY_PATTERNS = [
  /-per-(capita|person|people|population|10k|100k|1000|million|area|km2|household|employee|establishment|hour|day|month|year|student|teacher|child)/i,
  /-rate$/i,
  /-ratio$/i,
  /-percentage$/i,
  /-proportion$/i,
  /-share$/i,
  /-density$/i,
  /^(per-)/i,
];

const RATIO_UNITS = new Set(["%", "％", "‰", "‱", "倍", "比"]);

export function isBaseMetric(input: IsBaseMetricInput): boolean {
  const { key, unit, groupKey, calculation } = input;

  if (DENOMINATOR_KEYS.has(key)) return false;

  if (groupKey && groupKey !== key) return false;

  if (calculation?.type === "ratio" || calculation?.type === "per_capita" || calculation?.type === "subtraction") {
    return false;
  }

  if (unit && RATIO_UNITS.has(unit.trim())) return false;

  for (const pattern of DERIVED_KEY_PATTERNS) {
    if (pattern.test(key)) return false;
  }

  return true;
}
