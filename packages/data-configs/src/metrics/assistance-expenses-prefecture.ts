import type { MetricConfig } from "../types";

export const assistanceExpensesPrefecture: MetricConfig = {
  "key": "assistance-expenses-prefecture",
  "title": "扶助費",
  "subtitle": "都道府県財政",
  "unit": "",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310404",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "扶助費ランキング都道府県【2022年】｜1位東京都（191,313,453）",
  "seoDescription": "2022年の扶助費の都道府県別ランキング。1位東京都（191,313,453）、最下位鳥取県（6,292,905）で30.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
