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
import { CLIMATE_CATALOG } from "./climate";
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

import { CONSTRUCTION_INDUSTRY_CATALOG } from "./construction-industry";
import { WASTE_RECYCLING_CATALOG } from "./waste-recycling";
import { INFORMATION_INDUSTRY_CATALOG } from "./information-industry";
import {
  EXISTING_THEME_SECTION_EXTENSIONS,
  EXPANDED_THEME_CATALOGS,
  extensionMetric,
} from "./expanded";

export * from "./types";
export * from "./tourism-seasonality-source";
export * from "./nutrition-source";
export * from "./evidence-lenses";
export * from "./population-pyramid-deps";
export * from "./chart-color-role";
export * from "./stat-series-ref";
export * from "./chart-dependencies";
export * from "./faq-markdown";
export * from "./theme-metric-content";
export * from "./catalog-sections";

/** カタログ駆動テーマの登録簿 (key → catalog)。 */
const BASE_THEME_CATALOGS: Record<string, ThemeCatalog> = {
  "aging-society": AGING_SOCIETY_CATALOG,
  "consumer-prices": CONSUMER_PRICES_CATALOG,
  "climate": CLIMATE_CATALOG,
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
  "construction-industry": CONSTRUCTION_INDUSTRY_CATALOG,
  "waste-recycling": WASTE_RECYCLING_CATALOG,
  "information-industry": INFORMATION_INDUSTRY_CATALOG,
  ...EXPANDED_THEME_CATALOGS,
};

function withExistingExtensions(catalog: ThemeCatalog): ThemeCatalog {
  const extensions = EXISTING_THEME_SECTION_EXTENSIONS[catalog.key];
  if (!extensions) return catalog;
  const metricGroups = [...(catalog.metricGroups ?? [])];
  const sections = [...(catalog.sections ?? [])];
  const metrics = [...catalog.metrics];
  for (const extension of extensions) {
    if (extension.existingSectionKey || !extension.metrics.length) continue;
    const groupKeys: string[] = [];
    extension.metrics.forEach((metric, index) => {
      const entry = extensionMetric(metric);
      const existingIndex = metrics.findIndex((existing) => existing.rankingKey === entry.rankingKey);
      if (existingIndex === -1) {
        metrics.push(entry);
      } else if (metrics[existingIndex].role === 'context' && entry.role !== 'context') {
        // An explicit chapter card needs a visible indicator, not an index-only entry.
        metrics[existingIndex] = { ...metrics[existingIndex], role: 'secondary' };
      }
      if (entry.role === 'context') return;
      const groupKey = `candidate-${extension.candidateId}-${index + 1}`;
      groupKeys.push(groupKey);
      metricGroups.push({ key: groupKey, title: `${extension.title}｜${entry.shortLabel}`, rankingKeys: [entry.rankingKey], defaultCheckedKeys: [entry.rankingKey] });
    });
    sections.push({ key: `candidate-${extension.candidateId}`, title: extension.title, description: extension.description, metricGroupKeys: groupKeys, ...(extension.chartKeys ? { chartKeys: extension.chartKeys } : {}), ...(extension.embeddedSectionKeys ? { embeddedSectionKeys: extension.embeddedSectionKeys } : {}) });
  }
  return { ...catalog, metrics, metricGroups, sections };
}

/** カタログ駆動テーマの登録簿 (key → catalog)。 */
export const THEME_CATALOGS: Record<string, ThemeCatalog> = Object.fromEntries(
  Object.entries(BASE_THEME_CATALOGS).map(([key, catalog]) => [key, withExistingExtensions(catalog)]),
);

/** 登録済みカタログ配列。 */
export function listThemeCatalogs(): ThemeCatalog[] {
  return Object.values(THEME_CATALOGS);
}

export { INDUSTRY_SPECIALIZATION_SOURCE } from './industry-specialization-source';

export { MEDICAL_WORKFORCE_SOURCE } from './medical-workforce-source';
export * from './earthquake-exposure-source';
export * from './earthquake-exposure-schema';
export * from './population-core-profile';

export { GRADUATION_PATHS_SOURCE } from './graduation-paths-source';

export { PHYSICAL_ACTIVITY_SOURCE } from './physical-activity-source';

export { PROPERTY_PRICE_DISTRIBUTION_SOURCE } from './property-price-distribution-source';
export { FACTORY_INVESTMENT_SOURCE } from './factory-investment-source';
export { DEPOPULATED_SETTLEMENTS_SOURCE } from './depopulated-settlements-source';
export { FREIGHT_OD_SOURCE } from './freight-od-source';
export { AIRPORT_TRAFFIC_SOURCE } from './airport-traffic-source';

export { BRIDGE_INSPECTION_AGE_SOURCE } from './bridge-inspection-age-source';

export { WATER_QUALITY_SOURCE } from './water-quality-source';

export { CULTURAL_HERITAGE_SOURCE } from './cultural-heritage-source';

export { SNOW_DESIGNATION_SOURCE } from './snow-designation-source';
export { LANDSLIDE_EXPOSURE_SOURCE } from './landslide-exposure-source';

export * from './shelter-applicability-source';

export * from './tsunami-exposure-source';
export * from './tsunami-exposure-schema';

export { LOCAL_FINANCE_RATIO_METRICS } from "./local-finance-ratios";
