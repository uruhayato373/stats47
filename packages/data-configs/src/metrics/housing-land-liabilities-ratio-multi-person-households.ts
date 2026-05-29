import type { MetricConfig } from "../types";

export const housingLandLiabilitiesRatioMultiPersonHouseholds: MetricConfig = {
  "key": "housing-land-liabilities-ratio-multi-person-households",
  "title": "住宅・土地のための負債割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L07412",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
  "seoTitle": "住宅・土地のための負債割合ランキング都道府県【2019年】｜1位神奈川県（91.8％）",
  "seoDescription": "2019年の住宅・土地のための負債割合の都道府県別ランキング。1位神奈川県（91.8％）、最下位群馬県（77.1％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
