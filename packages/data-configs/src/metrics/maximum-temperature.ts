import type { MetricConfig } from "../types";

export const maximumTemperature: MetricConfig = {
  "key": "maximum-temperature",
  "title": "最高気温",
  "subtitle": "日最高気温の月平均の最高値",
  "description": "各都道府県の代表観測地点における、日最高気温の月平均値のうち年間で最も高い値です。観測史上の最高気温や県全域の平均気温ではありません。",
  "unit": "℃",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "最高気温ランキング都道府県【2024年】｜1位熊本県（36.2℃）",
  "seoDescription": "2024年の最高気温の都道府県別ランキング。1位熊本県（36.2℃）、最下位北海道（28.4℃）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
