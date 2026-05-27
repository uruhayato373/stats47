import type { MetricConfig } from "../types";

export const firefightingExpenditureRatioPrefMunicipal: MetricConfig = {
  "key": "firefighting-expenditure-ratio-pref-municipal",
  "title": "消防費割合",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D03114",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "消防費割合ランキング都道府県【2022年】｜1位青森県（6.64％）",
  "seoDescription": "2022年の消防費割合の都道府県別ランキング。1位青森県（6.64％）、最下位東京都（2.06％）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
