import type { MetricConfig } from "../types";

export const autolockApartmentRate: MetricConfig = {
  "key": "autolock-apartment-rate",
  "title": "オートロック付共同住宅率",
  "subtitle": "非木造共同住宅のうちオートロック式の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004021535",
    "cdCat01": "1",
    "cdCat02": "00",
    "displayName": "住宅・土地統計調査",
    "url": "https://www.stat.go.jp/data/jyutaku/2023/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "calendar",
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
  "seoTitle": "オートロック付共同住宅率ランキング都道府県【2023年】｜1位福岡県（55.5％）",
  "seoDescription": "2023年のオートロック付共同住宅率の都道府県別ランキング。1位福岡県（55.5％）、最下位鳥取県（14.4％）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
