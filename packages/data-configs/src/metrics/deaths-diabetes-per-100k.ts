import type { MetricConfig } from "../types";

export const deathsDiabetesPer100k: MetricConfig = {
  "key": "deaths-diabetes-per-100k",
  "title": "糖尿病による死亡者数",
  "subtitle": "日本人人口10万人当たり",
  "description": "人口動態調査の糖尿病による死亡者数を日本人人口で除し、10万倍した値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1985,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
        1983,
        1984,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "deaths-diabetes",
  "seoTitle": "糖尿病による死亡者数ランキング都道府県【2023年】｜1位青森県（20.6人）",
  "seoDescription": "2023年の糖尿病による死亡者数の都道府県別ランキング。1位青森県（20.6人）、最下位愛知県（8.1人）で2.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
