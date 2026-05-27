import type { MetricConfig } from "../types";

export const tatamiPerPersonRented: MetricConfig = {
  "key": "tatami-per-person-rented",
  "title": "借家住宅の畳数",
  "unit": "畳",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0220302",
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
  "seoTitle": "借家住宅の畳数ランキング都道府県【2023年】｜1位北海道（12.61畳）",
  "seoDescription": "2023年の借家住宅の畳数の都道府県別ランキング。1位北海道（12.61畳）、最下位沖縄県（9.31畳）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
