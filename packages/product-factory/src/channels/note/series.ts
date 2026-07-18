/**
 * note シリーズ・レジストリ (SSOT)。
 * 仕様 §4 の推奨シリーズ + K/L の集約先。各シリーズは note vertical=stats47-note 配下に置く。
 */
import type { NoteProductSeries } from "./types";
import type { ProductFamily } from "../../catalog/types";

export interface NoteSeriesMeta {
  readonly key: NoteProductSeries;
  readonly name: string;
  /** 主対象読者。 */
  readonly audience: string;
  /** 主に束ねる商品 family。 */
  readonly families: readonly ProductFamily[];
  /** 共通の送客先 (記事個別で上書き可)。 */
  readonly defaultStats47Targets: readonly string[];
}

export const NOTE_SERIES_REGISTRY: Readonly<Record<NoteProductSeries, NoteSeriesMeta>> = {
  "prefecture-map-powerpoint": {
    key: "prefecture-map-powerpoint",
    name: "都道府県地図・PowerPoint 図表",
    audience: "企画・営業・広報",
    families: ["asset", "powerpoint"],
    defaultStats47Targets: ["/ranking", "/themes"],
  },
  "prefecture-excel-analysis": {
    key: "prefecture-excel-analysis",
    name: "Excel ランキング・地図・比較分析",
    audience: "実務担当",
    families: ["excel"],
    defaultStats47Targets: ["/ranking", "/compare"],
  },
  "regional-data-packs": {
    key: "regional-data-packs",
    name: "テーマ別データパックと読み方",
    audience: "調査・メディア",
    families: ["data"],
    defaultStats47Targets: ["/themes", "/ranking"],
  },
  "business-location-analysis": {
    key: "business-location-analysis",
    name: "出店・採用・観光の地域分析",
    audience: "事業者",
    families: ["industry"],
    defaultStats47Targets: ["/areas", "/compare"],
  },
  "government-statistics-work": {
    key: "government-statistics-work",
    name: "自治体統計業務の時短",
    audience: "公務員",
    families: ["government"],
    defaultStats47Targets: ["/themes/local-finance", "/ranking"],
  },
  "media-data-visuals": {
    key: "media-data-visuals",
    name: "記事・動画・SNS の統計図版",
    audience: "クリエイター",
    families: ["media"],
    defaultStats47Targets: ["/ranking", "/blog"],
  },
  "statistics-education": {
    key: "statistics-education",
    name: "探究・授業・研修の統計教材",
    audience: "教員・学生",
    families: ["education"],
    defaultStats47Targets: ["/ranking", "/themes"],
  },
  "life-area-comparison": {
    key: "life-area-comparison",
    name: "移住・転職・子育ての地域比較",
    audience: "個人",
    families: ["consumer"],
    defaultStats47Targets: ["/areas", "/compare"],
  },
  "custom-analysis-services": {
    key: "custom-analysis-services",
    name: "個別制作サービスの選び方・事例",
    audience: "法人",
    families: ["service"],
    defaultStats47Targets: ["/", "/ranking"],
  },
  "license-guide": {
    key: "license-guide",
    name: "ライセンス・版の違いガイド",
    audience: "購入検討者",
    families: ["license"],
    defaultStats47Targets: ["/"],
  },
  "free-samples": {
    key: "free-samples",
    name: "無料サンプルと使い方",
    audience: "はじめての購入者",
    families: ["entry"],
    defaultStats47Targets: ["/ranking", "/themes"],
  },
} as const;

export const NOTE_SERIES_KEYS: readonly NoteProductSeries[] = Object.keys(
  NOTE_SERIES_REGISTRY,
) as NoteProductSeries[];

/** family → 既定シリーズ (article-plan がシリーズ指定を省いた場合の整合チェック用)。 */
export const SERIES_BY_FAMILY: Readonly<Record<ProductFamily, NoteProductSeries>> = {
  asset: "prefecture-map-powerpoint",
  powerpoint: "prefecture-map-powerpoint",
  excel: "prefecture-excel-analysis",
  data: "regional-data-packs",
  industry: "business-location-analysis",
  government: "government-statistics-work",
  media: "media-data-visuals",
  education: "statistics-education",
  consumer: "life-area-comparison",
  service: "custom-analysis-services",
  license: "license-guide",
  entry: "free-samples",
} as const;
