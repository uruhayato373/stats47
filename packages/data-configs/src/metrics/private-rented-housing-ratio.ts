import type { MetricConfig } from "../types";

export const privateRentedHousingRatio: MetricConfig = {
  "key": "private-rented-housing-ratio",
  "title": "民営借家比率",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H0130202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
  "seoTitle": "民営借家比率ランキング都道府県【2023年】｜1位沖縄県（44.4％）",
  "seoDescription": "2023年の民営借家比率の都道府県別ランキング。1位沖縄県（44.4％）、最下位秋田県（16.7％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
