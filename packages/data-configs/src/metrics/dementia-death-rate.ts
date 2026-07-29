import type { MetricConfig } from "../types";

export const dementiaDeathRate: MetricConfig = {
  "key": "dementia-death-rate",
  "title": "認知症死亡率",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411663",
    "cdCat01": "05100",
    "displayName": "人口動態調査",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/kakutei23/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
    ],
  },
  "seoTitle": "認知症死亡率ランキング都道府県【2024年】｜1位新潟県（40.6人）",
  "seoDescription": "2024年の認知症死亡率の都道府県別ランキング。1位新潟県（40.6人）、最下位沖縄県（12.5人）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
