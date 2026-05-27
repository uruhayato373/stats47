import type { MetricConfig } from "../types";

export const bowlingAlleyPublic: MetricConfig = {
  "key": "bowling-alley-public",
  "title": "ボウリング場数（公共）",
  "unit": "施設",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G310213",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2005,
      2008,
      2011,
      2015,
      2018,
      2021,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "施設/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "ボウリング場数（公共）ランキング都道府県【2021年】｜1位沖縄県（0施設）",
  "seoDescription": "2021年のボウリング場数（公共）の都道府県別ランキング。1位沖縄県（0施設）、最下位沖縄県（0施設）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
