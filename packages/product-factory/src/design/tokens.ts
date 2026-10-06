import { SITE } from "@stats47/data-configs";
import { CHART_COLOR_ROLE_HEX } from "@stats47/data-configs/theme-catalog";

/**
 * デザイントークン。stats47 の既存ルック (svg-builder / choropleth) に合わせ、別ブランドを増やさない。
 * 静的 SVG / Office 図で使うため固定 hex (CSS 変数は使えない環境がある)。
 */
export const BRAND = {
  brandName: "stats47",
  domain: SITE.domain,
  fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
  text: "#1f2937",
  subtext: "#6b7280",
  axis: "#374151",
  tick: "#6b7280",
  grid: "#e5e7eb",
  cardBg: "#ffffff",
  plotBg: "#f9fafb",
  border: "#d1d5db",
  mapNoData: "#e5e7eb",
  mapBorder: "#94a3b8",
} as const;

/** 指標の意味に固定した色 (ページ間統一)。正典は ThemeCatalog の CHART_COLOR_ROLE_HEX。 */
export const SEMANTIC_COLORS = {
  male: CHART_COLOR_ROLE_HEX.male,
  female: CHART_COLOR_ROLE_HEX.female,
  danger: CHART_COLOR_ROLE_HEX.danger,
  count: CHART_COLOR_ROLE_HEX.count,
  improve: CHART_COLOR_ROLE_HEX.improve,
  neutral: CHART_COLOR_ROLE_HEX.neutral,
  special: CHART_COLOR_ROLE_HEX.special,
  population: CHART_COLOR_ROLE_HEX.population,
} as const;
