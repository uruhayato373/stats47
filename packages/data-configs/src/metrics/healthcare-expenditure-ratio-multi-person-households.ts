import type { MetricConfig } from "../types";

export const healthcareExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "healthcare-expenditure-ratio-multi-person-households",
  "title": "保健医療費割合",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02416",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2010,
      2011,
      2012,
      2013,
      2014,
      2015,
      2016,
      2017,
      2018,
      2019,
      2020,
      2024,
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
  "seoTitle": "保健医療費割合ランキング都道府県【2024年】｜1位神奈川県（5.8％）",
  "seoDescription": "2024年の保健医療費割合の都道府県別ランキング。1位神奈川県（5.8％）、最下位高知県（3.8％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
