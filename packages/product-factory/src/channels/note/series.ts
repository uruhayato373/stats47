/** note シリーズ・レジストリ。商品 family ではなく現行14パックの theme を受ける。 */
import type { PackTheme } from "../../catalog/types";
import type { NoteProductSeries } from "./types";

export interface NoteSeriesMeta {
  readonly key: NoteProductSeries;
  readonly name: string;
  readonly audience: string;
  readonly themes: readonly PackTheme[];
  readonly defaultStats47Targets: readonly string[];
}

export const SERIES_BY_THEME: Readonly<Record<PackTheme, NoteProductSeries>> = {
  "population-household": "regional-data-packs",
  "income-wage-hiring": "life-area-comparison",
  "tourism-lodging": "business-location-analysis",
  "municipal-finance": "government-statistics-work",
  "healthcare-nursing": "life-area-comparison",
  "education-childcare": "statistics-education",
  "migration-living": "life-area-comparison",
  "retail-trade-area": "business-location-analysis",
  "industry-economy": "business-location-analysis",
  "disaster-infrastructure": "government-statistics-work",
  "map-chart-assets": "prefecture-map-powerpoint",
  "all-in-one": "regional-data-packs",
  "free-trial": "free-samples",
  "household-consumption": "life-area-comparison",
};

function themesFor(series: NoteProductSeries): PackTheme[] {
  return (Object.entries(SERIES_BY_THEME) as Array<[PackTheme, NoteProductSeries]>)
    .filter(([, value]) => value === series)
    .map(([theme]) => theme);
}

export const NOTE_SERIES_REGISTRY: Readonly<Record<NoteProductSeries, NoteSeriesMeta>> = {
  "prefecture-map-powerpoint": {
    key: "prefecture-map-powerpoint",
    name: "都道府県地図・PowerPoint 図表",
    audience: "企画・営業・広報",
    themes: themesFor("prefecture-map-powerpoint"),
    defaultStats47Targets: ["/ranking", "/themes"],
  },
  "prefecture-excel-analysis": {
    key: "prefecture-excel-analysis",
    name: "Excel ランキング・地図・比較分析",
    audience: "実務担当",
    themes: themesFor("prefecture-excel-analysis"),
    defaultStats47Targets: ["/ranking", "/compare"],
  },
  "regional-data-packs": {
    key: "regional-data-packs",
    name: "テーマ別データパックと読み方",
    audience: "調査・メディア",
    themes: themesFor("regional-data-packs"),
    defaultStats47Targets: ["/themes", "/ranking"],
  },
  "business-location-analysis": {
    key: "business-location-analysis",
    name: "出店・採用・観光の地域分析",
    audience: "事業者",
    themes: themesFor("business-location-analysis"),
    defaultStats47Targets: ["/areas", "/compare"],
  },
  "government-statistics-work": {
    key: "government-statistics-work",
    name: "自治体統計業務の時短",
    audience: "公務員",
    themes: themesFor("government-statistics-work"),
    defaultStats47Targets: ["/themes/local-finance", "/ranking"],
  },
  "media-data-visuals": {
    key: "media-data-visuals",
    name: "記事・動画・SNS の統計図版",
    audience: "クリエイター",
    themes: themesFor("media-data-visuals"),
    defaultStats47Targets: ["/ranking", "/blog"],
  },
  "statistics-education": {
    key: "statistics-education",
    name: "探究・授業・研修の統計教材",
    audience: "教員・学生",
    themes: themesFor("statistics-education"),
    defaultStats47Targets: ["/ranking", "/themes"],
  },
  "life-area-comparison": {
    key: "life-area-comparison",
    name: "暮らし・所得・家計の地域比較",
    audience: "個人・調査担当",
    themes: themesFor("life-area-comparison"),
    defaultStats47Targets: ["/areas", "/compare"],
  },
  "custom-analysis-services": {
    key: "custom-analysis-services",
    name: "個別制作サービスの選び方・事例",
    audience: "法人",
    themes: themesFor("custom-analysis-services"),
    defaultStats47Targets: ["/", "/ranking"],
  },
  "license-guide": {
    key: "license-guide",
    name: "ライセンス・版の違いガイド",
    audience: "購入検討者",
    themes: themesFor("license-guide"),
    defaultStats47Targets: ["/"],
  },
  "free-samples": {
    key: "free-samples",
    name: "無料サンプルと使い方",
    audience: "はじめての購入者",
    themes: themesFor("free-samples"),
    defaultStats47Targets: ["/ranking", "/themes"],
  },
};

export const NOTE_SERIES_KEYS: readonly NoteProductSeries[] = Object.keys(
  NOTE_SERIES_REGISTRY,
) as NoteProductSeries[];
