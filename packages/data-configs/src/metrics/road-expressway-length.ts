import type { MetricConfig } from "../types";

export const roadExpresswayLength: MetricConfig = {
  "key": "road-expressway-length",
  "title": "道路実延長（高速道路）",
  "subtitle": "高速道路のみ",
  "description": "都道府県内の高速自動車国道など高速道路の実延長。重複区間を除いた供用延長を示す。",
  "unit": "km",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H7113",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
        "unit": "km/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "km/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "道路実延長（高速道路）ランキング都道府県【2023年】｜1位北海道（786.7km）",
  "seoDescription": "2023年の道路実延長（高速道路）の都道府県別ランキング。1位北海道（786.7km）、最下位奈良県（17.8km）で44.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
