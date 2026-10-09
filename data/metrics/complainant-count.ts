import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const complainantCount: MetricConfig = {
  "key": "complainant-count",
  "title": "有訴者率",
  "subtitle": "総数",
  "unit": "人口千対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I8103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1989,
      1992,
      1995,
      1998,
      2001,
      2004,
      2007,
      2010,
      2013,
      2016,
      2019,
      2022,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "complainant-count",
  "seoTitle": "有訴者率ランキング都道府県【2022年】｜1位兵庫県（314.9）",
  "seoDescription": "2022年の有訴者率の都道府県別ランキング。1位兵庫県（314.9）、最下位東京都（244）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
