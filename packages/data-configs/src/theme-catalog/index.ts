/**
 * ThemeCatalog レジストリ — カタログ駆動テーマの単一入口。
 *
 * テーマの定義 (指標・チャート・章・選定根拠) の SSOT は `data/themes/catalogs/<key>.json`。
 * ここは JSON を読んで型を付けるだけで、合成や既定値の補完はしない (JSON の中身がそのまま表示に使われる)。
 * 形は `data/themes/theme-catalog.schema.json`、意味は `validate-theme-catalog.ts` が検査する。
 * 登録テーマの IndicatorSet TS + page-components JSON は生成物であり手編集しない。
 * 新規登録: `data/themes/catalogs/<key>.json` を追加 → `./catalogs/index.ts` に import を足す → generate:catalog → commit。
 * 一覧と `data/themes/catalogs/` の一致は `__tests__/theme-catalog-json.test.ts` が検査する。
 */

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

export { THEME_CATALOGS, listThemeCatalogs } from "./catalogs";

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
