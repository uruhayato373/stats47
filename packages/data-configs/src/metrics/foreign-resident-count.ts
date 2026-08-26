import type { MetricConfig } from "../types";

export const foreignResidentCount: MetricConfig = {
  "key": "foreign-resident-count",
  "title": "外国人人口",
  "subtitle": "総数",
  "description": "国勢調査で日本国籍以外に分類された、調査地域に常住する人の総数です。",
  "note": "日本と外国の両方の国籍を持つ人は日本人に分類されます。外国人総数には無国籍・国名不詳を含みます。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1700",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
    "decimalPlaces": 0,
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
  "groupKey": "foreign-resident-count",
  "seoTitle": "外国人人口ランキング都道府県【2020年】｜1位東京都（483,372人）",
  "seoDescription": "2020年の外国人人口の都道府県別ランキング。1位東京都（483,372人）、最下位秋田県（3,651人）で132.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
