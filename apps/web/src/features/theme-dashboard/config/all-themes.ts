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
  // local-finance の財政フロー Sankey。hideMap 中は他 GIS 同様一旦非表示 (定義は残し復活可能)。
  "local-finance": ["finance-flow"],
};

/**
 * 2026-06-20 デザイン整理: 全テーマを一旦 hideMap (stats-card のみ) に統一。
 * 埋め込み GIS セクション (EMBEDDED_SECTIONS) も ThemePageLayout 側で
 * hideMap のとき一旦非表示にする (定義は残すので復活可能)。
 *
 * 地図/チャート/GIS を戻したいテーマは、その themeKey を MAP_VISIBLE_THEMES に
 * 追加する (既定は空 = 全テーマ非表示)。ThemeDashboardTabbed が hideMap: true を
 * 参照してカードのみレイアウトに分岐する。
 */
const MAP_VISIBLE_THEMES = new Set<string>([]);

/** 全テーマ一覧（表示順） */
export const ALL_THEMES: ThemeConfig[] = THEME_SETS.map((set) => {
  const config = toThemeConfig(set);
  const embeddedSections = EMBEDDED_SECTIONS[config.themeKey];
  // embeddedSections の定義は残す (どのテーマが GIS を使っていたか分かるように)。
  // 実際の描画は ThemePageLayout が hideMap を見て一旦止める。
  const withEmbedded = embeddedSections ? { ...config, embeddedSections } : config;
  const hideMap = !MAP_VISIBLE_THEMES.has(config.themeKey);
  return hideMap ? { ...withEmbedded, hideMap: true } : withEmbedded;
});
