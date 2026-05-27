import type { MetricConfig } from "../types";

export const clothingFootwearExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "clothing-footwear-expenditure-ratio-multi-person-households",
  "title": "被服及び履物費割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02415",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "seoTitle": "被服及び履物費割合ランキング都道府県【2024年】｜1位愛知県（3.9％）",
  "seoDescription": "2024年の被服及び履物費割合の都道府県別ランキング。1位愛知県（3.9％）、最下位島根県（2.4％）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
