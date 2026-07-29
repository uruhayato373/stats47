import type { MetricConfig } from "../types";

export const laborForcePopulationRatioMan: MetricConfig = {
  "key": "labor-force-population-ratio-man",
  "title": "労働力人口比率",
  "subtitle": "男性",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0110101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
  "seoTitle": "労働力人口比率ランキング都道府県【2020年】｜1位福井県（69.4％）",
  "seoDescription": "2020年の労働力人口比率の都道府県別ランキング。1位福井県（69.4％）、最下位沖縄県（56.9％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
