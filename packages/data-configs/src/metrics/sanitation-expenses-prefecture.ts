import type { MetricConfig } from "../types";

export const sanitationExpensesPrefecture: MetricConfig = {
  "key": "sanitation-expenses-prefecture",
  "title": "衛生費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
  "groupKey": "sanitation-expenses-prefecture",
  "seoTitle": "衛生費ランキング都道府県【2022年】｜1位東京都（1,179,203,304）",
  "seoDescription": "2022年の衛生費の都道府県別ランキング。1位東京都（1,179,203,304）、最下位福井県（32,424,145）で36.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
