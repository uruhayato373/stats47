import {
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
  REAL_INCOME_SET,
  LABOR_MOBILITY_SET,
  LOCAL_FINANCE_SET,
  LOCAL_FINANCE_CITY_SET,
  FISHERY_MARINE_SET,
  PORTS_SET,
  RAILWAY_SET,
  ROADS_SET,
  CLIMATE_SET,
} from "@stats47/types";

import { toThemeConfig } from "../lib/to-theme-config";

import type { ThemeConfig } from "../types";

/** テーマ表示順（IndicatorSet） */
const THEME_SETS = [
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
  REAL_INCOME_SET,
  LABOR_MOBILITY_SET,
  LOCAL_FINANCE_SET,
  LOCAL_FINANCE_CITY_SET,
  FISHERY_MARINE_SET,
  PORTS_SET,
  RAILWAY_SET,
  ROADS_SET,
  CLIMATE_SET,
];

/**
 * テーマ → 埋め込み GIS マップ section のマッピング（web 専用）。
 *
 * 共有型 IndicatorSet (compare / Remotion も参照) には含めず、ここで付与する。
 * キーは THEME_SECTION_REGISTRY (config/theme-section-registry.tsx) と対応。
 * 1 つの section を複数テーマから再利用できる
 * (depopulation-medical を healthcare / aging-society の両方で使用)。
 */
const EMBEDDED_SECTIONS: Record<string, string[]> = {
  "population-dynamics": ["migration-flow", "commute-flow"],
  roads: ["highway"],
  railway: ["station-passengers"],
  healthcare: ["depopulation-medical"],
  "aging-society": ["depopulation-medical"],
  climate: ["sunshine-map"],
};

/** 全テーマ一覧（表示順） */
export const ALL_THEMES: ThemeConfig[] = THEME_SETS.map((set) => {
  const config = toThemeConfig(set);
  const embeddedSections = EMBEDDED_SECTIONS[config.themeKey];
  return embeddedSections ? { ...config, embeddedSections } : config;
});
