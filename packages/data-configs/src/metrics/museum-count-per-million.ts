import type { MetricConfig } from "../types";

export const museumCountPerMillion: MetricConfig = {
  "key": "museum-count-per-million",
  "title": "博物館数",
  "unit": "館",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G01107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1981,
      1984,
      1987,
      1990,
      1993,
      1996,
      1999,
      2002,
      2005,
      2008,
      2011,
      2015,
      2018,
      2021,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "館/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "館/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "博物館数ランキング都道府県【2021年】｜1位長野県（40.8館）",
  "seoDescription": "2021年の博物館数の都道府県別ランキング。1位長野県（40.8館）、最下位埼玉県（3.5館）で11.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
