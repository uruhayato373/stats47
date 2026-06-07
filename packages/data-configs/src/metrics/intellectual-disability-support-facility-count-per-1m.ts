import type { MetricConfig } from "../types";

export const intellectualDisabilitySupportFacilityCountPer1m: MetricConfig = {
  "key": "intellectual-disability-support-facility-count-per-1m",
  "title": "知的障害者援護施設数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J02401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
    "to": 2011,
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
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "知的障害者援護施設数ランキング都道府県【2011年】｜1位高知県（30.3所）",
  "seoDescription": "2011年の知的障害者援護施設数の都道府県別ランキング。1位高知県（30.3所）、最下位東京都（3.4所）で8.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
