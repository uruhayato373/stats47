/**
 * デザイントークン。stats47 の既存ルック (svg-builder / choropleth) に合わせ、別ブランドを増やさない。
 * 静的 SVG / Office 図で使うため固定 hex (CSS 変数は使えない環境がある)。
 */
export const BRAND = {
  brandName: "stats47",
  domain: "stats47.jp",
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

/** 指標の意味に固定した色 (ページ間統一)。 */
export const SEMANTIC_COLORS = {
  male: "#3b82f6",
  female: "#ec4899",
  danger: "#ef4444",
  count: "#f59e0b",
  improve: "#22c55e",
  neutral: "#6b7280",
  special: "#8b5cf6",
  population: "#3b82f6",
} as const;
