import type { MetricConfig } from "../types";

export const cityGasSupplyAreaHouseholdRatio: MetricConfig = {
  "key": "city-gas-supply-area-household-ratio",
  "title": "都市ガス供給区域内世帯比率",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2016,
    "to": 2016,
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
  "seoTitle": "都市ガス供給区域内世帯比率ランキング都道府県【2016年】｜1位大阪府（106.7％）",
  "seoDescription": "2016年の都市ガス供給区域内世帯比率の都道府県別ランキング。1位大阪府（106.7％）、最下位徳島県（23.4％）で4.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
