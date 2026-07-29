import type { MetricConfig } from "../types";

export const healthPhysicalEducationExpensesPrefecture: MetricConfig = {
  "key": "health-physical-education-expenses-prefecture",
  "title": "保健体育費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D3103118",
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
    ],
  },
  "seoTitle": "保健体育費ランキング都道府県【2022年】｜1位東京都（67,718,434）",
  "seoDescription": "2022年の保健体育費の都道府県別ランキング。1位東京都（67,718,434）、最下位秋田県（363,481）で186.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
