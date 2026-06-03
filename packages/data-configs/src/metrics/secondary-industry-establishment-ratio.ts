import type { MetricConfig } from "../types";

export const secondaryIndustryEstablishmentRatio: MetricConfig = {
  "key": "secondary-industry-establishment-ratio",
  "title": "第2次産業事業所数構成比",
  "subtitle": "事業所・企業統計",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2009,
      2014,
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
  "seoTitle": "第2次産業事業所数構成比ランキング都道府県【2014年】｜1位岐阜県（24.05％）",
  "seoDescription": "2014年の第2次産業事業所数構成比の都道府県別ランキング。1位岐阜県（24.05％）、最下位沖縄県（11.08％）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
