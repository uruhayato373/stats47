import type { MetricConfig } from "../types";

export const tatamiPerPersonOwner: MetricConfig = {
  "key": "tatami-per-person-owner",
  "title": "持ち家住宅の畳数",
  "unit": "畳",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0220301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "持ち家住宅の畳数ランキング都道府県【2023年】｜1位秋田県（19.83畳）",
  "seoDescription": "2023年の持ち家住宅の畳数の都道府県別ランキング。1位秋田県（19.83畳）、最下位沖縄県（13.93畳）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
