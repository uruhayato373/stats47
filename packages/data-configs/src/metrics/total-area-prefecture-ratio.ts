import type { MetricConfig } from "../types";

export const totalAreaPrefectureRatio: MetricConfig = {
  "key": "total-area-prefecture-ratio",
  "title": "総面積（都道府県面積に占める割合）",
  "subtitle": "都道府県比率",
  "unit": "％",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020302",
    "cdCat01": "#B01101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  },
  "seoTitle": "総面積（都道府県面積に占める割合）ランキング市区町村【2023年】｜1位富山県 富山市（29.23％）",
  "seoDescription": "2023年の総面積（都道府県面積に占める割合）の市区町村別ランキング。1位富山県 富山市（29.23％）、最下位静岡県 浜松市 浜名区（0％）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
