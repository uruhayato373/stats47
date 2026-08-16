import type { MetricConfig } from "../types";

export const noiseRegulationRate: MetricConfig = {
  "key": "noise-regulation-rate",
  "title": "騒音規制法地域指定率",
  "subtitle": "騒音規制法に基づく地域指定の割合",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003368792",
    "cdCat01": "90100",
    "displayName": "騒音規制法施行状況調査",
    "url": "https://www.env.go.jp/air/noise/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2016,
    "to": 2016,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "騒音規制法地域指定率ランキング都道府県【2016年】｜1位鹿児島県（100％）",
  "seoDescription": "2016年の騒音規制法地域指定率の都道府県別ランキング。1位鹿児島県（100％）、最下位青森県（20％）で5.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
