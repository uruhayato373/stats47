import type { MetricConfig } from "../types";

export const tertiaryIndustryEstablishmentRatioCensus: MetricConfig = {
  "key": "tertiary-industry-establishment-ratio-census",
  "title": "第3次産業事業所数構成比",
  "subtitle": "経済センサス",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1986,
      1991,
      1996,
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
  "seoTitle": "第3次産業事業所数構成比ランキング都道府県【2006年】｜1位沖縄県（88.82％）",
  "seoDescription": "2006年の第3次産業事業所数構成比の都道府県別ランキング。1位沖縄県（88.82％）、最下位岐阜県（73.79％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
