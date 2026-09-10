import type { MetricConfig } from "../types";

export const deathsMalignantNeoplasmsPer100k: MetricConfig = {
  "key": "deaths-malignant-neoplasms-per-100k",
  "title": "腫瘍による死亡者数",
  "description": "人口動態調査の悪性新生物による死亡者数を日本人人口で除し、10万倍した値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
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
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2023
    ]
  },
  "yearFormat": "fiscal",
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
  "seoTitle": "腫瘍による死亡者数ランキング都道府県【2023年】｜1位秋田県（437.5人）",
  "seoDescription": "2023年の腫瘍による死亡者数の都道府県別ランキング。1位秋田県（437.5人）、最下位沖縄県（235.9人）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "日本人人口10万人当たり"
};
