import type { MetricConfig } from "../types";

export const establishmentRatio300plusEmployeesPrivate: MetricConfig = {
  "key": "establishment-ratio-300plus-employees-private",
  "title": "従業者300人以上の事業所割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02210",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
  "seoTitle": "従業者300人以上の事業所割合ランキング都道府県【2021年】｜1位東京都（0.55％）",
  "seoDescription": "2021年の従業者300人以上の事業所割合の都道府県別ランキング。1位東京都（0.55％）、最下位高知県（0.08％）で6.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
