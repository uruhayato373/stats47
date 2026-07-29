import type { MetricConfig } from "../types";

export const trafficAccidentDeathsPer100k: MetricConfig = {
  "key": "traffic-accident-deaths-per-100k",
  "title": "交通事故死者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04106",
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
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "groupKey": "traffic-accident-deaths-per-100-accidents",
  "seoTitle": "交通事故死者数ランキング都道府県【2024年】｜1位徳島県（4.8人）",
  "seoDescription": "2024年の交通事故死者数の都道府県別ランキング。1位徳島県（4.8人）、最下位東京都（1人）で4.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
