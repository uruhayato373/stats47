import type { MetricConfig } from "../types";

export const foodExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "food-expenditure-ratio-multi-person-households",
  "title": "食料費割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02411",
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
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
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
  "seoTitle": "食料費割合ランキング都道府県【2024年】｜1位兵庫県（31.8％）",
  "seoDescription": "2024年の食料費割合の都道府県別ランキング。1位兵庫県（31.8％）、最下位栃木県（25.2％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
