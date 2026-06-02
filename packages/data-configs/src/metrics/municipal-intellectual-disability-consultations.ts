import type { MetricConfig } from "../types";

export const municipalIntellectualDisabilityConsultations: MetricConfig = {
  "key": "municipal-intellectual-disability-consultations",
  "title": "市町村における知的障害者相談実人員",
  "subtitle": "総数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J3208",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2003,
      2004,
      2005,
      2006,
      2007,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "municipal-intellectual-disability-consultations",
  "seoTitle": "市町村における知的障害者相談実人員ランキング都道府県【2007年】｜1位東京都（65,643人）",
  "seoDescription": "2007年の市町村における知的障害者相談実人員の都道府県別ランキング。1位東京都（65,643人）、最下位高知県（1,365人）で48.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
