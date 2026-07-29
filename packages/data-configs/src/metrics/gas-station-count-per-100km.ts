import type { MetricConfig } from "../types";

export const gasStationCountPer100km: MetricConfig = {
  "key": "gas-station-count-per-100km",
  "title": "給油所数",
  "unit": "箇所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06126",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
      2023,
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
        "unit": "箇所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "箇所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "給油所数ランキング都道府県【2023年】｜1位大阪府（4.4箇所）",
  "seoDescription": "2023年の給油所数の都道府県別ランキング。1位大阪府（4.4箇所）、最下位岩手県（1.4箇所）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
