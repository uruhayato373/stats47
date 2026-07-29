import type { MetricConfig } from "../types";

export const employmentMobilityRate: MetricConfig = {
  "key": "employment-mobility-rate",
  "title": "就業異動率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F04104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1979,
      1982,
      1987,
      1992,
      1997,
      2002,
      2007,
      2012,
      2017,
      2022,
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
  "seoTitle": "就業異動率ランキング都道府県【2022年】｜1位東京都（9.7％）",
  "seoDescription": "2022年の就業異動率の都道府県別ランキング。1位東京都（9.7％）、最下位秋田県（6.4％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
