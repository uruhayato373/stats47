import type { MetricConfig } from "../types";

export const windPowerCapacity: MetricConfig = {
  "key": "wind-power-capacity",
  "title": "風力発電導入量（設備容量）",
  "subtitle": "発電容量",
  "unit": "kW",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2017,
    "to": 2017,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.001,
    "decimalPlaces": 0,
    "displayUnit": "MW",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "kW/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "kW/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "風力発電導入量（設備容量）ランキング都道府県【2017年】｜1位青森県（417,463kW）",
  "seoDescription": "2017年の風力発電導入量（設備容量）の都道府県別ランキング。1位青森県（417,463kW）、最下位香川県（0kW）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
