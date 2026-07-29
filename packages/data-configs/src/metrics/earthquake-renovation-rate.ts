import type { MetricConfig } from "../types";

export const earthquakeRenovationRate: MetricConfig = {
  "key": "earthquake-renovation-rate",
  "title": "耐震改修工事実施率",
  "subtitle": "2019年以降に耐震改修工事をした持ち家の割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0004025528",
    "cdCat01": "0",
    "cdCat02": "0",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "耐震改修工事実施率ランキング都道府県【2023年】｜1位高知県（4.53％）",
  "seoDescription": "2023年の耐震改修工事実施率の都道府県別ランキング。1位高知県（4.53％）、最下位沖縄県（1.01％）で4.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
