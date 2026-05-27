import type { MetricConfig } from "../types";

export const pneumoniaDeathCount: MetricConfig = {
  "key": "pneumonia-death-count",
  "title": "肺炎による死亡者数",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003412078",
    "cdCat02": "00100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2015000000,
      2016000000,
      2017000000,
      2018000000,
      2019000000,
      2020000000,
      2021000000,
      2022000000,
      2023000000,
      2024000000,
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "pneumonia-death-count",
  "seoTitle": "肺炎による死亡者数ランキング都道府県【2024000000年】｜1位大阪府（6,696人）",
  "seoDescription": "2024000000年の肺炎による死亡者数の都道府県別ランキング。1位大阪府（6,696人）、最下位鳥取県（278人）で24.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
