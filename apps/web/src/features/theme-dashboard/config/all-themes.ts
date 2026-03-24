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
} from "@stats47/types";

import type { ThemeConfig } from "../types";
import { toThemeConfig } from "../lib/to-theme-config";

/** 全テーマ一覧（表示順） */
export const ALL_THEMES: ThemeConfig[] = [
  toThemeConfig(POPULATION_DYNAMICS_SET),
  toThemeConfig(AGING_SOCIETY_SET),
  toThemeConfig(LIVING_HOUSING_SET),
  toThemeConfig(LOCAL_ECONOMY_SET),
  toThemeConfig(LABOR_WAGES_SET),
  toThemeConfig(MANUFACTURING_SET),
  toThemeConfig(HEALTHCARE_SET),
  toThemeConfig(SAFETY_SET),
  toThemeConfig(EDUCATION_CULTURE_SET),
  toThemeConfig(TOURISM_SET),
  toThemeConfig(CONSUMER_PRICES_SET),
  toThemeConfig(FOREIGN_RESIDENTS_SET),
];
