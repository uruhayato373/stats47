import type { MetricConfig } from "../types";

/**
 * 47 都道府県 年間総乗降客数 (鉄道駅集計)。
 * Remotion `StationPassengersReel` で使用。
 *
 * TODO (Phase 7): source.resourceId の確定とデータ投入。
 *   - 国交省 駅別乗降客数調査の MLIT データプラットフォーム resourceId を特定
 *   - 確定後 `/page-data-batch --metric station-passengers-annual-total` で R2 投入
 *   - 現状: `apps/remotion/public/station-passengers/{NN,lines-NN}.json` の 2026-05-25 snapshot を継続使用
 */
export const stationPassengersAnnualTotal: MetricConfig = {
  key: "station-passengers-annual-total",
  title: "都道府県別 年間総乗降客数",
  subtitle: "国交省 駅別乗降客数調査",
  description:
    "都道府県内の鉄道駅における年間乗降客数の合計。Remotion StationPassengersReel で使用。",
  unit: "人",
  category: "tourism",
  source: {
    kind: "mlit",
    resourceId: "TODO-STATION-PASSENGERS",
    displayName: "国交省 駅別乗降客数調査",
    url: "https://www.mlit.go.jp/sogoseisaku/soukou/sogoseisaku_soukou_fr_000038.html",
  },
  entities: ["prefecture"],
  years: "all",
  yearFormat: "fiscal",
  visualization: {
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "zero",
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
