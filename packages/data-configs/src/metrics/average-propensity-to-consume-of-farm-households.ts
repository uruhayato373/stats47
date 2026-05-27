import type { MetricConfig } from "../types";

export const averagePropensityToConsumeOfFarmHouseholds: MetricConfig = {
  "key": "average-propensity-to-consume-of-farm-households",
  "title": "農家世帯の平均消費性向",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2003,
    "to": 2003,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
  "seoTitle": "農家世帯の平均消費性向ランキング都道府県【2003年】｜1位東京都（87.9％）",
  "seoDescription": "2003年の農家世帯の平均消費性向の都道府県別ランキング。1位東京都（87.9％）、最下位北海道（61％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
