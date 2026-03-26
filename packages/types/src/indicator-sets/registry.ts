import type { IndicatorSet } from "../indicator-set";

import { POPULATION_DYNAMICS_SET } from "./population-dynamics";
import { AGING_SOCIETY_SET } from "./aging-society";
import { LIVING_HOUSING_SET } from "./living-housing";
import { LOCAL_ECONOMY_SET } from "./local-economy";
import { LABOR_WAGES_SET } from "./labor-wages";
import { MANUFACTURING_SET } from "./manufacturing";
import { HEALTHCARE_SET } from "./healthcare";
import { SAFETY_SET } from "./safety";
import { EDUCATION_CULTURE_SET } from "./education-culture";
import { TOURISM_SET } from "./tourism";
import { CONSUMER_PRICES_SET } from "./consumer-prices";
import { FOREIGN_RESIDENTS_SET } from "./foreign-residents";
import { OCCUPATION_SALARY_SET } from "./occupation-salary";
import { COMPARE_FISCAL_SET } from "./compare-fiscal";
import { COMPARE_SALARY_SET } from "./compare-salary";
import { COMPARE_SPENDING_SET } from "./compare-spending";
import { COMPARE_GOVERNOR_SET } from "./compare-governor";
import { COMPARE_DEBT_SET } from "./compare-debt";

// ============================================================================
// 個別 export（直接参照用）
// ============================================================================

export {
  POPULATION_DYNAMICS_SET,
  AGING_SOCIETY_SET,
  LIVING_HOUSING_SET,
  LOCAL_ECONOMY_SET,
  LABOR_WAGES_SET,
  MANUFACTURING_SET,
  HEALTHCARE_SET,
  SAFETY_SET,
  EDUCATION_CULTURE_SET,
  TOURISM_SET,
  CONSUMER_PRICES_SET,
  FOREIGN_RESIDENTS_SET,
  OCCUPATION_SALARY_SET,
  COMPARE_FISCAL_SET,
  COMPARE_SALARY_SET,
  COMPARE_SPENDING_SET,
  COMPARE_GOVERNOR_SET,
  COMPARE_DEBT_SET,
};

// ============================================================================
// テーマ用セット（Web ダッシュボード表示順）
// ============================================================================

export const THEME_INDICATOR_SETS: IndicatorSet[] = [
  POPULATION_DYNAMICS_SET,
  AGING_SOCIETY_SET,
  LIVING_HOUSING_SET,
  LOCAL_ECONOMY_SET,
  LABOR_WAGES_SET,
  MANUFACTURING_SET,
  HEALTHCARE_SET,
  SAFETY_SET,
  EDUCATION_CULTURE_SET,
  TOURISM_SET,
  CONSUMER_PRICES_SET,
  FOREIGN_RESIDENTS_SET,
  OCCUPATION_SALARY_SET,
];

// ============================================================================
// Compare 用セット
// ============================================================================

export const COMPARE_INDICATOR_SETS: IndicatorSet[] = [
  COMPARE_FISCAL_SET,
  COMPARE_SALARY_SET,
  COMPARE_SPENDING_SET,
  COMPARE_GOVERNOR_SET,
  COMPARE_DEBT_SET,
];

// ============================================================================
// 全セット（テーマ + Compare）
// ============================================================================

export const ALL_INDICATOR_SETS: IndicatorSet[] = [
  ...THEME_INDICATOR_SETS,
  ...COMPARE_INDICATOR_SETS,
];

// ============================================================================
// ルックアップヘルパー
// ============================================================================

const setByKey = new Map<string, IndicatorSet>(
  ALL_INDICATOR_SETS.map((s) => [s.key, s]),
);

/** キーで IndicatorSet を取得（見つからない場合 undefined） */
export function findIndicatorSet(key: string): IndicatorSet | undefined {
  return setByKey.get(key);
}

/** キーで IndicatorSet を取得（見つからない場合 throw） */
export function getIndicatorSet(key: string): IndicatorSet {
  const set = setByKey.get(key);
  if (!set) {
    throw new Error(`IndicatorSet not found: ${key}`);
  }
  return set;
}

/**
 * IndicatorSet から rankingKey 一覧を抽出
 * @param excludeContext true の場合 role="context" を除外（compare 等で使用）
 */
export function getRankingKeys(
  set: IndicatorSet,
  excludeContext = false,
): string[] {
  const indicators = excludeContext
    ? set.indicators.filter((i) => i.role !== "context")
    : set.indicators;
  return indicators.map((i) => i.rankingKey);
}

/**
 * IndicatorSet から primary 指標の rankingKey を取得
 * primary がなければ先頭の指標を返す
 */
export function getPrimaryRankingKey(set: IndicatorSet): string {
  const primary = set.indicators.find((i) => i.role === "primary");
  return primary?.rankingKey ?? set.indicators[0].rankingKey;
}
