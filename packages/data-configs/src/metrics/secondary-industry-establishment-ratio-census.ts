import type { MetricConfig } from "../types";

export const secondaryIndustryEstablishmentRatioCensus: MetricConfig = {
  "key": "secondary-industry-establishment-ratio-census",
  "title": "第2次産業事業所数構成比",
  "subtitle": "経済センサス",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2001,
      2006,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "第2次産業事業所数構成比ランキング都道府県【2006年】｜1位岐阜県（25.81％）",
  "seoDescription": "2006年の第2次産業事業所数構成比の都道府県別ランキング。1位岐阜県（25.81％）、最下位沖縄県（10.91％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
