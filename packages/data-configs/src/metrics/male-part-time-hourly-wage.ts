import type { MetricConfig } from "../types";

export const malePartTimeHourlyWage: MetricConfig = {
  "key": "male-part-time-hourly-wage",
  "title": "男性パートタイムの給与",
  "subtitle": "男性・1時間当たり",
  "unit": "円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F06207",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "男性パートタイムの給与ランキング都道府県【2024年】｜1位香川県（3,355円）",
  "seoDescription": "2024年の男性パートタイムの給与の都道府県別ランキング。1位香川県（3,355円）、最下位熊本県（1,234円）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
