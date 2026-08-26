/**
 * ThemeCatalog レジストリ — カタログ駆動テーマの単一入口。
 *
 * ⚠️ ここに登録されたテーマだけが generator/validator の対象になる。
 * 登録テーマの IndicatorSet TS + page-components JSON は生成物であり手編集しない。
 * 新規登録: catalog TS を追加 → ここに登録 → golden diff → commit。
 */
import type { ThemeCatalog } from "./types";
import { AGING_SOCIETY_CATALOG } from "./aging-society";
import { CONSUMER_PRICES_CATALOG } from "./consumer-prices";
import { EDUCATION_CULTURE_CATALOG } from "./education-culture";
import { FISHERY_MARINE_CATALOG } from "./fishery-marine";
import { FOREIGN_RESIDENTS_CATALOG } from "./foreign-residents";
import { HEALTHCARE_CATALOG } from "./healthcare";
import { LABOR_MOBILITY_CATALOG } from "./labor-mobility";
import { LABOR_WAGES_CATALOG } from "./labor-wages";
import { LIVING_HOUSING_CATALOG } from "./living-housing";
import { LOCAL_ECONOMY_CATALOG } from "./local-economy";
import { LOCAL_FINANCE_CATALOG } from "./local-finance";
import { MANUFACTURING_CATALOG } from "./manufacturing";
import { OCCUPATION_SALARY_CATALOG } from "./occupation-salary";
import { POPULATION_DYNAMICS_CATALOG } from "./population-dynamics";
import { PORTS_CATALOG } from "./ports";
import { RAILWAY_CATALOG } from "./railway";
import { REAL_INCOME_CATALOG } from "./real-income";
import { ROADS_CATALOG } from "./roads";
import { SAFETY_CATALOG } from "./safety";
import { TOURISM_CATALOG } from "./tourism";

export * from "./types";
export * from "./evidence-lenses";
export * from "./population-pyramid-deps";
export * from "./chart-color-role";
export * from "./stat-series-ref";
export * from "./chart-dependencies";
export * from "./faq-markdown";
export * from "./theme-metric-content";

/** カタログ駆動テーマの登録簿 (key → catalog)。 */
export const THEME_CATALOGS: Record<string, ThemeCatalog> = {
  "aging-society": AGING_SOCIETY_CATALOG,
  "consumer-prices": CONSUMER_PRICES_CATALOG,
  "education-culture": EDUCATION_CULTURE_CATALOG,
  "fishery-marine": FISHERY_MARINE_CATALOG,
  "foreign-residents": FOREIGN_RESIDENTS_CATALOG,
  "healthcare": HEALTHCARE_CATALOG,
  "labor-mobility": LABOR_MOBILITY_CATALOG,
  "labor-wages": LABOR_WAGES_CATALOG,
  "living-housing": LIVING_HOUSING_CATALOG,
  "local-economy": LOCAL_ECONOMY_CATALOG,
  "local-finance": LOCAL_FINANCE_CATALOG,
  "manufacturing": MANUFACTURING_CATALOG,
  "occupation-salary": OCCUPATION_SALARY_CATALOG,
  "population-dynamics": POPULATION_DYNAMICS_CATALOG,
  "ports": PORTS_CATALOG,
  "railway": RAILWAY_CATALOG,
  "real-income": REAL_INCOME_CATALOG,
  "roads": ROADS_CATALOG,
  "safety": SAFETY_CATALOG,
  "tourism": TOURISM_CATALOG,
};

/** 登録済みカタログ配列。 */
export function listThemeCatalogs(): ThemeCatalog[] {
  return Object.values(THEME_CATALOGS);
}
