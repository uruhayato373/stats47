import type { MetricConfig } from "../types";

export const populationGrowthRate: MetricConfig = {
  "key": "population-growth-rate",
  "title": "人口増減率",
  "unit": "‰",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A192003",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
      2024,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "人口増減率ランキング都道府県【2024年】｜1位東京都（6.6‰）",
  "seoDescription": "2024年の人口増減率の都道府県別ランキング。1位東京都（6.6‰）、最下位秋田県（-18.7‰）で-0.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
