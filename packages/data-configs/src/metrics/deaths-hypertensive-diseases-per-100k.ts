import type { MetricConfig } from "../types";

export const deathsHypertensiveDiseasesPer100k: MetricConfig = {
  "key": "deaths-hypertensive-diseases-per-100k",
  "title": "高血圧性疾患による死亡者数",
  "subtitle": "人口10万人当たり",
  "description": "高血圧性疾患による死亡者数を、人口10万人当たりで示した値。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
      2023,
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
  "groupKey": "deaths-hypertensive-diseases",
  "seoTitle": "高血圧性疾患による死亡者数ランキング都道府県【2023年】｜1位群馬県（20.9人）",
  "seoDescription": "2023年の高血圧性疾患による死亡者数の都道府県別ランキング。1位群馬県（20.9人）、最下位愛知県（3.4人）で6.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
