import type { MetricConfig } from "../types";

export const privateSportsFacility: MetricConfig = {
  "key": "private-sports-facility",
  "title": "民間体育施設数",
  "unit": "施設",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G3201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      1999,
      2002,
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
    ],
  },
  "seoTitle": "民間体育施設数ランキング都道府県【2021年】｜1位東京都（3,937施設）",
  "seoDescription": "2021年の民間体育施設数の都道府県別ランキング。1位東京都（3,937施設）、最下位島根県（89施設）で44.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
