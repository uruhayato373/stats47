import type { MetricConfig } from "../types";

export const inPrefectureEmployedPeopleRatio: MetricConfig = {
  "key": "in-prefecture-employed-people-ratio",
  "title": "県内就業者比率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F02501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
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
  "seoTitle": "県内就業者比率ランキング都道府県【2020年】｜1位新潟県（97.8％）",
  "seoDescription": "2020年の県内就業者比率の都道府県別ランキング。1位新潟県（97.8％）、最下位埼玉県（68.6％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
