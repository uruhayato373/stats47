import type { MetricConfig } from "../types";

export const sexRatioTotal: MetricConfig = {
  "key": "sex-ratio-total",
  "title": "人口性比",
  "subtitle": "総人口",
  "unit": "（女=100）",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A192002",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolatePiYG",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "人口性比ランキング都道府県【2024年】｜1位茨城県（100.1）",
  "seoDescription": "2024年の人口性比の都道府県別ランキング。1位茨城県（100.1）、最下位奈良県（88.7）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
