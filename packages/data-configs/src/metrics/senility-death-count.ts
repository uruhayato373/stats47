import type { MetricConfig } from "../types";

export const senilityDeathCount: MetricConfig = {
  "key": "senility-death-count",
  "title": "老衰による死亡者数",
  "subtitle": "総数",
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "senility-death-count",
  "seoTitle": "老衰による死亡者数ランキング都道府県【2024年】｜1位東京都（19,385人）",
  "seoDescription": "2024年の老衰による死亡者数の都道府県別ランキング。1位東京都（19,385人）、最下位鳥取県（1,134人）で17.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
