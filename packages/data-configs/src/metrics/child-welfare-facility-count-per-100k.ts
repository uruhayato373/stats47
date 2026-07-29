import type { MetricConfig } from "../types";

export const childWelfareFacilityCountPer100k: MetricConfig = {
  "key": "child-welfare-facility-count-per-100k",
  "title": "児童福祉施設等数",
  "unit": "所",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J02501",
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
  "seoTitle": "児童福祉施設等数ランキング都道府県【2023年】｜1位沖縄県（22.41所）",
  "seoDescription": "2023年の児童福祉施設等数の都道府県別ランキング。1位沖縄県（22.41所）、最下位群馬県（5.68所）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
