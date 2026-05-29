import type { MetricConfig } from "../types";

export const establishmentRatio100299EmployeesPrivate: MetricConfig = {
  "key": "establishment-ratio-100-299-employees-private",
  "title": "100〜299人の事業所割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02209",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2009,
      2011,
      2014,
      2016,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "100〜299人の事業所割合ランキング都道府県【2021年】｜1位東京都（1.52％）",
  "seoDescription": "2021年の100〜299人の事業所割合の都道府県別ランキング。1位東京都（1.52％）、最下位宮崎県（0.65％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
