import type { MetricConfig } from "../types";

/**
 * 47 都道府県 年間総乗降客数 (鉄道駅集計)。
 * Remotion `StationPassengersReel` で使用。
 *
 * resourceId "S12" (国土数値情報 駅別乗降客数) は packages/gis/src/mlit-ksj/datasets.ts で確認済み
 * (dataId:"S12", coverage:"national", isRankingTarget:false)。同データは PR #328 で駅別乗降客数機能・
 * 47連結動画に既に使用実績あり (memory project_station_passengers)。
 *
 * TODO (Phase 7): データ投入は未完了 (isRankingTarget:false のため ranking pipeline 未配線)。削除条件: 下記 3 手順で R2 投入後に本コメント削除。
 *   - gis-pipeline-runner で S12 を R2 (gis/mlit-ksj/S12/) へ変換・投入
 *   - 都道府県別集計ロジックを実装後 `/page-data-batch --metric station-passengers-annual-total` で R2 投入
 *   - 現状: `apps/remotion/public/station-passengers/{NN,lines-NN}.json` の 2026-05-25 snapshot を継続使用
 */
export const stationPassengersAnnualTotal: MetricConfig = {
  key: "station-passengers-annual-total",
  title: "都道府県別 年間総乗降客数",
  subtitle: "国土数値情報 駅別乗降客数調査 (S12)",
  description:
    "都道府県内の鉄道駅における年間乗降客数の合計。Remotion StationPassengersReel で使用。",
  unit: "人",
  category: "tourism",
  source: {
    kind: "mlit",
    resourceId: "S12",
    displayName: "国土数値情報 駅別乗降客数 (S12)",
    url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12.html",
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
