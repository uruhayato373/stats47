import type { MetricConfig } from "../types";

export const daytimePopulationRatio: MetricConfig = {
  "key": "daytime-population-ratio",
  "title": "昼夜間人口比率",
  "unit": "%",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003454499",
    "cdCat01": "0",
    "cdCat02": "00",
    "displayName": "国勢調査",
    "url": "https://www.stat.go.jp/data/kokusei/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateRdYlBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "daytime-population",
  "seoTitle": "昼夜間人口比率ランキング都道府県【2020年】｜1位東京都（116.14%）",
  "seoDescription": "2020年の昼夜間人口比率の都道府県別ランキング。1位東京都（116.14%）、最下位埼玉県（89.61%）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
