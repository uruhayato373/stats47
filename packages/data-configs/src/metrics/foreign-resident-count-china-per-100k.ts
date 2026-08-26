import type { MetricConfig } from "../types";

export const foreignResidentCountChinaPer100k: MetricConfig = {
  "key": "foreign-resident-count-china-per-100k",
  "title": "外国人人口",
  "subtitle": "中国籍（10万人当たり）",
  "description": "国勢調査の中国籍外国人人口を総人口で除し、人口10万人当たりに換算した人数です。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0160102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
  "groupKey": "foreign-resident-count-china",
  "seoTitle": "外国人人口ランキング都道府県【2020年】｜1位東京都（1,393.4人）",
  "seoDescription": "2020年の外国人人口の都道府県別ランキング。1位東京都（1,393.4人）、最下位青森県（83.1人）で16.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
