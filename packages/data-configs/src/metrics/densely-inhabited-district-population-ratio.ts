import type { MetricConfig } from "../types";

export const denselyInhabitedDistrictPopulationRatio: MetricConfig = {
  "key": "densely-inhabited-district-population-ratio",
  "title": "人口集中地区人口比率",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
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
  "seoTitle": "人口集中地区人口比率ランキング都道府県【2020年】｜1位東京都（98.6％）",
  "seoDescription": "2020年の人口集中地区人口比率の都道府県別ランキング。1位東京都（98.6％）、最下位島根県（25.6％）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
