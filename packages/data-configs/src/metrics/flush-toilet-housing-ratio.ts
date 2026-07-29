import type { MetricConfig } from "../types";

export const flushToiletHousingRatio: MetricConfig = {
  "key": "flush-toilet-housing-ratio",
  "title": "水洗トイレのある住宅比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H02302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1978,
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
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
  "seoTitle": "水洗トイレのある住宅比率ランキング都道府県【2008年】｜1位沖縄県（97.2％）",
  "seoDescription": "2008年の水洗トイレのある住宅比率の都道府県別ランキング。1位沖縄県（97.2％）、最下位岩手県（69.7％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
