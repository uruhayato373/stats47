import "server-only";

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
} from "@stats47/types";

import { toThemeConfig } from "./lib/to-theme-config";

export { ALL_THEMES } from "./config/all-themes";

export const POPULATION_DYNAMICS_THEME = toThemeConfig(POPULATION_DYNAMICS_SET);
export const AGING_SOCIETY_THEME = toThemeConfig(AGING_SOCIETY_SET);
export const LIVING_HOUSING_THEME = toThemeConfig(LIVING_HOUSING_SET);
export const LOCAL_ECONOMY_THEME = toThemeConfig(LOCAL_ECONOMY_SET);
export const LABOR_WAGES_THEME = toThemeConfig(LABOR_WAGES_SET);
export const MANUFACTURING_THEME = toThemeConfig(MANUFACTURING_SET);
export const HEALTHCARE_THEME = toThemeConfig(HEALTHCARE_SET);
export const SAFETY_THEME = toThemeConfig(SAFETY_SET);
export const EDUCATION_CULTURE_THEME = toThemeConfig(EDUCATION_CULTURE_SET);
export const TOURISM_THEME = toThemeConfig(TOURISM_SET);
export const CONSUMER_PRICES_THEME = toThemeConfig(CONSUMER_PRICES_SET);
export const FOREIGN_RESIDENTS_THEME = toThemeConfig(FOREIGN_RESIDENTS_SET);
export const OCCUPATION_SALARY_THEME = toThemeConfig(OCCUPATION_SALARY_SET);
export const REAL_INCOME_THEME = toThemeConfig(REAL_INCOME_SET);
export const LABOR_MOBILITY_THEME = toThemeConfig(LABOR_MOBILITY_SET);

// Server Component
export { ThemePageLayout } from "./components/ThemePageLayout";

// Server-only loader
export { loadThemeData } from "./lib/load-theme-data";
export type { ThemePageData } from "./lib/load-theme-data";
