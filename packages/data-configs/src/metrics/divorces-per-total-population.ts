import type { MetricConfig } from "../types";

export const divorcesPerTotalPopulation: MetricConfig = {
  "key": "divorces-per-total-population",
  "title": "離婚率",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06602",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "離婚率ランキング都道府県【2024年】｜東京5.7‐・秋田2.5‐、都市ほど高い構造と沖縄急落の理由",
  "seoDescription": "2024年の離婚率ランキング。東京都（5.7‐）が最多、最下位は秋田県（2.5‐）で2.3倍差。沖縄は2015年の6.1から急落。都市ほど高い理由を47都道府県で可視化。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
