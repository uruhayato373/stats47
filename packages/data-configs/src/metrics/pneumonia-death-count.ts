import type { MetricConfig } from "../types";

export const pneumoniaDeathCount: MetricConfig = {
  "key": "pneumonia-death-count",
  "title": "肺炎による死亡者数",
  "subtitle": "総数",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003412078",
    "cdCat01": "00100",
    "cdCat03": "10200",
    "cdCat02": "00100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
      2021,
      2022,
      2023,
      2024,
    ],
  },
  "yearFormat": "calendar",
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
  "groupKey": "pneumonia-death-count",
  "seoTitle": "肺炎による死亡者数ランキング都道府県【2024年】｜1位大阪府（6,696人）",
  "seoDescription": "2024年の肺炎による死亡者数の都道府県別ランキング。1位大阪府（6,696人）、最下位鳥取県（278人）で24.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
