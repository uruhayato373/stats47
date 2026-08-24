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
  FISHERY_MARINE_SET,
  PORTS_SET,
  RAILWAY_SET,
  ROADS_SET,
  CLIMATE_SET,
} from '@stats47/types';

import { toThemeConfig } from '../lib/to-theme-config';

import type { ThemeConfig } from '../types';

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
  'population-dynamics': ['migration-flow', 'commute-flow'],
  roads: ['highway'],
  railway: ['station-passengers'],
  healthcare: ['depopulation-medical'],
  'aging-society': ['depopulation-medical'],
  climate: ['sunshine-map'],
  // ※ local-finance は専用 bespoke ページ (LocalFinanceDashboard) が財政フロー Sankey を
  //   自前で持つため、汎用 embeddedSections には登録しない。
};

/**
 * 2026-06-20 デザイン整理: 全テーマを hideMap (stats-card 主役) に統一。
 * hideMap = ThemeDashboardTabbed の地図タブ UI (コロプレス/指標タブ/年度セレクタ) を
 * 非表示にしカード主役にするフラグ。
 *
 * 地図タブ UI を戻したいテーマは themeKey を MAP_VISIBLE_THEMES に追加する (既定は空)。
 *
 * ※ 埋め込み GIS セクション (EMBEDDED_SECTIONS: 移動フロー/駅乗降/高速道路/過疎×医療/日照) は
 *   hideMap とは独立に描画する (2026-07-04〜)。カード主役のまま主題深掘り GIS を出す。
 */
const MAP_VISIBLE_THEMES = new Set<string>([]);

/** 全テーマ一覧（表示順） */
export const ALL_THEMES: ThemeConfig[] = THEME_SETS.map((set) => {
  const config = toThemeConfig(set);
  const embeddedSections = EMBEDDED_SECTIONS[config.themeKey];
  const withEmbedded = embeddedSections
    ? { ...config, embeddedSections }
    : config;
  const hideMap = !MAP_VISIBLE_THEMES.has(config.themeKey);
  return hideMap ? { ...withEmbedded, hideMap: true } : withEmbedded;
});
