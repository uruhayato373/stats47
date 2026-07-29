import type { MetricConfig } from "../types";

export const utilitiesExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "utilities-expenditure-ratio-multi-person-households",
  "title": "光熱・水道費割合",
  "unit": "％",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02413",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2000,
      2001,
      2002,
      2003,
      2004,
      2024,
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
  },
  "seoTitle": "光熱・水道費割合ランキング都道府県【2024年】｜1位青森県（11.5％）",
  "seoDescription": "2024年の光熱・水道費割合の都道府県別ランキング。1位青森県（11.5％）、最下位東京都（6％）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
