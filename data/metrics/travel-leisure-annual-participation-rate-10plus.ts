import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const travelLeisureAnnualParticipationRate10plus: MetricConfig = {
  "key": "travel-leisure-annual-participation-rate-10plus",
  "title": "旅行・行楽の年間行動者率",
  "subtitle": "10歳以上",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G043061",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      2001,
      2006,
      2011,
      2016,
      2021,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "旅行・行楽の年間行動者率ランキング都道府県【2021年】｜1位愛知県（57.6％）",
  "seoDescription": "2021年の旅行・行楽の年間行動者率の都道府県別ランキング。1位愛知県（57.6％）、最下位沖縄県（31.1％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
