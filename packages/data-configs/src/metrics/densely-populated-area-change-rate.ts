import type { MetricConfig } from "../types";

export const denselyPopulatedAreaChangeRate: MetricConfig = {
  "key": "densely-populated-area-change-rate",
  "title": "人口集中地区面積の変化率",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A01404",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2010,
      2015,
      2020,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "人口集中地区面積の変化率ランキング都道府県【2020年】｜1位佐賀県（17.3％）",
  "seoDescription": "2020年の人口集中地区面積の変化率の都道府県別ランキング。1位佐賀県（17.3％）、最下位秋田県（-3％）で-5.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
