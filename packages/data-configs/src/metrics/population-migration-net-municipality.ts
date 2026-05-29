import type { MetricConfig } from "../types";

/**
 * 市区町村別 純移動 (転入 - 転出)。
 * Remotion `MigrationFlowReel` の municipalities 表示に使用。
 *
 * TODO (Phase 7): source.statsDataId の確定とデータ投入。
 *   - 住基移動報告 市区町村別表 の statsDataId を /search-estat で特定
 *   - 確定後 `/page-data-batch --metric population-migration-net-municipality` で R2 投入
 *   - 現状: `apps/remotion/public/migration-flow/municipalities/{NN}.json` の 2026-05-25 snapshot を継続使用
 */
export const populationMigrationNetMunicipality: MetricConfig = {
  key: "population-migration-net-municipality",
  title: "市区町村別純移動 (転入−転出)",
  subtitle: "住民基本台帳人口移動報告",
  description:
    "市区町村単位の年間転入数 - 転出数 (純移動)。Remotion MigrationFlowReel の municipalities セクションで使用。",
  unit: "人",
  category: "population",
  source: {
    kind: "estat",
    statsDataId: "TODO-MUNICIPALITY-MIGRATION",
    displayName: "住民基本台帳人口移動報告",
    url: "https://www.stat.go.jp/data/idou/index.html",
  },
  entities: ["city"],
  years: "all",
  yearFormat: "calendar",
  visualization: {
    colorScheme: "interpolateRdBu",
    colorSchemeType: "diverging",
    divergingMidpoint: "zero",
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  calculation: {
    isCalculated: false,
  },
  isActive: false,
  isFeatured: false,
  featuredOrder: 0,
};
