import type { MetricConfig } from "../types";

export const employeeRatio: MetricConfig = {
  "key": "employee-ratio",
  "title": "雇用者比率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F02301",
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
  "seoTitle": "雇用者比率ランキング都道府県【2020年】｜1位神奈川県（84.9％）",
  "seoDescription": "2020年の雇用者比率の都道府県別ランキング。1位神奈川県（84.9％）、最下位高知県（74.7％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
