import type { MetricConfig } from "../types";

export const dependentPopulationIndex: MetricConfig = {
  "key": "dependent-population-index",
  "title": "従属人口指数",
  "unit": "指数",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A03403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      1975,
      1976,
      1977,
      1978,
      1979,
      1980,
      1981,
      1991,
      1992,
      1993,
      1994,
      1995,
      1996,
      1997,
      1998,
      1999,
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
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
      2021,
      2022
    ]
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "従属人口指数ランキング都道府県【2022年】｜1位秋田県（91.9‐）",
  "seoDescription": "2022年の従属人口指数の都道府県別ランキング。1位秋田県（91.9‐）、最下位東京都（50.9‐）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "15～64歳人口100人当たり"
};
