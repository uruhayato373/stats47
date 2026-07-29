import type { MetricConfig } from "../types";

export const waterSupplyPopulation: MetricConfig = {
  "key": "water-supply-population",
  "title": "上水道給水人口",
  "unit": "人",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H530101",
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "万人",
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
    ],
  },
  "seoTitle": "上水道給水人口ランキング都道府県【2023年】｜1位東京都（14,095,121人）",
  "seoDescription": "2023年の上水道給水人口の都道府県別ランキング。1位東京都（14,095,121人）、最下位鳥取県（488,228人）で28.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
