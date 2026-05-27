import type { MetricConfig } from "../types";

export const criminalArrestRate: MetricConfig = {
  "key": "criminal-arrest-rate",
  "title": "刑法犯検挙率",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "刑法犯検挙率ランキング都道府県【2023年】｜1位島根県（72.7％）",
  "seoDescription": "2023年の刑法犯検挙率の都道府県別ランキング。1位島根県（72.7％）、最下位大阪府（26.7％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
