import type { MetricConfig } from "../types";

export const privateRailwayPassengerTransport: MetricConfig = {
  "key": "private-railway-passenger-transport",
  "title": "民鉄輸送人員",
  "description": "民営鉄道が輸送した年間旅客数。都道府県ごとの民鉄利用規模を千人単位で示す。",
  "unit": "千人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3705",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2009,
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
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
        "unit": "千人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "民鉄輸送人員ランキング都道府県【2023年】｜1位東京都（6,112,042.7千人）",
  "seoDescription": "2023年の民鉄輸送人員の都道府県別ランキング。1位東京都（6,112,042.7千人）、最下位宮崎県（0千人）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
