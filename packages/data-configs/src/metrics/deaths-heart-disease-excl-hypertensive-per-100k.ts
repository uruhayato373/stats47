import type { MetricConfig } from "../types";

export const deathsHeartDiseaseExclHypertensivePer100k: MetricConfig = {
  "key": "deaths-heart-disease-excl-hypertensive-per-100k",
  "title": "心疾患による死亡者数",
  "description": "人口動態調査の心疾患（高血圧性を除く）による死亡者数を日本人人口で除し、10万倍した値です。年齢調整死亡率ではありません。",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
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
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2023
    ]
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "seoTitle": "心疾患による死亡者数ランキング都道府県【2023年】｜1位山口県（284.2人）",
  "seoDescription": "2023年の心疾患による死亡者数の都道府県別ランキング。1位山口県（284.2人）、最下位愛知県（130.8人）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "日本人人口10万人当たり"
};
