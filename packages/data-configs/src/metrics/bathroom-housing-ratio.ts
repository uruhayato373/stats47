import type { MetricConfig } from "../types";

export const bathroomHousingRatio: MetricConfig = {
  "key": "bathroom-housing-ratio",
  "title": "浴室のある住宅比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H02303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2008,
    "to": 2008,
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
  },
  "seoTitle": "浴室のある住宅比率ランキング都道府県【2008年】｜1位佐賀県（98.6％）",
  "seoDescription": "2008年の浴室のある住宅比率の都道府県別ランキング。1位佐賀県（98.6％）、最下位東京都（91.4％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
